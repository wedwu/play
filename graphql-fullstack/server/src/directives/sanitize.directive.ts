/**
 * @sanitize directive — automatic string argument sanitization.
 *
 * Usage in schema:
 *   directive @sanitize(
 *     trim: Boolean
 *     lowercase: Boolean
 *     maxLength: Int
 *   ) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
 *
 * Examples:
 *   type Mutation {
 *     register(input: RegisterInput!): AuthPayload!
 *   }
 *
 *   input RegisterInput {
 *     email:    String! @sanitize(trim: true, lowercase: true)
 *     name:     String! @sanitize(trim: true, maxLength: 100)
 *     password: String!   # intentionally not sanitized — never mutate passwords
 *   }
 *
 * How it works:
 *   GraphQL directives on ARGUMENT_DEFINITION and INPUT_FIELD_DEFINITION are
 *   not natively applied by the executor — they exist only as metadata.
 *   This implementation wraps each affected field resolver and rewrites the
 *   relevant args before they reach the original resolver.
 *
 *   For input objects, we recursively walk the input type's fields and apply
 *   sanitization to any field that carries the directive. This means deep
 *   input nesting is handled correctly.
 *
 * Why this matters:
 *   Without sanitization, "  Admin@Example.COM  " and "admin@example.com"
 *   are different values in the DB. Normalizing at the schema boundary means
 *   no individual resolver needs to remember to call .trim()/.toLowerCase().
 */
import {
  defaultFieldResolver,
  GraphQLSchema,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLNamedType,
  isInputObjectType,
  GraphQLInputFieldConfig,
} from 'graphql';
import { mapSchema, MapperKind, getDirective } from '@graphql-tools/utils';
import { Context } from '../context';

const DIRECTIVE_NAME = 'sanitize';

export const sanitizeDirectiveTypeDefs = /* GraphQL */ `
  directive @sanitize(
    """Remove leading and trailing whitespace."""
    trim: Boolean
    """Convert to lowercase."""
    lowercase: Boolean
    """Truncate to this many characters."""
    maxLength: Int
  ) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
`;

function applySanitizationRules(
  value: unknown,
  rules: { trim?: boolean; lowercase?: boolean; maxLength?: number }
): unknown {
  if (typeof value !== 'string') return value;
  let v = value;
  if (rules.trim) v = v.trim();
  if (rules.lowercase) v = v.toLowerCase();
  if (rules.maxLength != null) v = v.slice(0, rules.maxLength);
  return v;
}

/**
 * Collect sanitization rules for a given input type's fields.
 * Returns a map of fieldName → rules for fields that carry @sanitize.
 */
function getRulesForInputType(
  type: GraphQLInputObjectType,
  schema: GraphQLSchema
): Record<string, { trim?: boolean; lowercase?: boolean; maxLength?: number }> {
  const rules: Record<string, { trim?: boolean; lowercase?: boolean; maxLength?: number }> = {};
  const fields = type.getFields();
  for (const [fieldName, field] of Object.entries(fields)) {
    const directive = getDirective(schema, field as unknown as GraphQLInputFieldConfig, DIRECTIVE_NAME)?.[0];
    if (directive) {
      rules[fieldName] = {
        trim: directive['trim'] as boolean | undefined,
        lowercase: directive['lowercase'] as boolean | undefined,
        maxLength: directive['maxLength'] as number | undefined,
      };
    }
  }
  return rules;
}

function unwrapType(type: GraphQLNamedType | GraphQLNonNull<any> | GraphQLList<any>): GraphQLNamedType {
  if ('ofType' in type) return unwrapType(type.ofType);
  return type as GraphQLNamedType;
}

/**
 * Recursively sanitize an input object according to the rules map.
 */
function sanitizeInputObject(
  obj: Record<string, unknown>,
  rules: Record<string, { trim?: boolean; lowercase?: boolean; maxLength?: number }>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };
  for (const [field, fieldRules] of Object.entries(rules)) {
    if (field in result) {
      result[field] = applySanitizationRules(result[field], fieldRules);
    }
  }
  return result;
}

export function applySanitizeDirective(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, _typeName, schema) => {
      const args = fieldConfig.args;
      if (!args) return fieldConfig;

      // Check if any argument carries @sanitize directly or its input type has @sanitize fields
      let hasSanitization = false;
      const argRules: Record<string, {
        direct?: { trim?: boolean; lowercase?: boolean; maxLength?: number };
        inputFieldRules?: Record<string, { trim?: boolean; lowercase?: boolean; maxLength?: number }>;
      }> = {};

      for (const [argName, argConfig] of Object.entries(args)) {
        const direct = getDirective(schema, argConfig, DIRECTIVE_NAME)?.[0];
        const namedType = unwrapType(argConfig.type as any);
        const inputRules = isInputObjectType(namedType)
          ? getRulesForInputType(namedType as GraphQLInputObjectType, schema)
          : {};

        if (direct || Object.keys(inputRules).length > 0) {
          hasSanitization = true;
          argRules[argName] = {
            direct: direct
              ? {
                  trim: direct['trim'] as boolean | undefined,
                  lowercase: direct['lowercase'] as boolean | undefined,
                  maxLength: direct['maxLength'] as number | undefined,
                }
              : undefined,
            inputFieldRules: Object.keys(inputRules).length > 0 ? inputRules : undefined,
          };
        }
      }

      if (!hasSanitization) return fieldConfig;

      const { resolve = defaultFieldResolver } = fieldConfig;

      return {
        ...fieldConfig,
        resolve(source, args: Record<string, unknown>, context: Context, info) {
          const sanitizedArgs = { ...args };

          for (const [argName, rules] of Object.entries(argRules)) {
            const value = sanitizedArgs[argName];

            if (rules.direct && typeof value === 'string') {
              sanitizedArgs[argName] = applySanitizationRules(value, rules.direct);
            }

            if (rules.inputFieldRules && value && typeof value === 'object' && !Array.isArray(value)) {
              sanitizedArgs[argName] = sanitizeInputObject(
                value as Record<string, unknown>,
                rules.inputFieldRules
              );
            }
          }

          return resolve(source, sanitizedArgs, context, info);
        },
      };
    },
  });
}
