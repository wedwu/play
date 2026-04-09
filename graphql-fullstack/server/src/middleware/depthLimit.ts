/**
 * depthLimit — Apollo Server plugin that rejects over-nested GraphQL queries.
 *
 * Without this, a malicious client can craft arbitrarily deep queries that
 * trigger cascading resolver calls and exhaust server resources:
 *
 *   query {
 *     project(id: "x") {
 *       tasks { edges { node { project { tasks { edges { node { ... } } } } } } }
 *     }
 *   }
 *
 * This plugin inspects the parsed document *before* any resolvers run and
 * returns a GraphQL error if the nesting depth exceeds `maxDepth`.
 *
 * It also enforces a maximum number of aliases per query to prevent a client
 * from batching many independent operations under one request:
 *
 *   query {
 *     a: project(id:"1") { ... }
 *     b: project(id:"2") { ... }
 *     ...100 more...
 *   }
 */
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import {
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  GraphQLError,
  InlineFragmentNode,
  OperationDefinitionNode,
  SelectionSetNode,
} from 'graphql';

interface DepthLimitOptions {
  /** Maximum allowed nesting depth (default: 7) */
  maxDepth?: number;
  /** Maximum number of unique aliases per document (default: 10) */
  maxAliases?: number;
}

function measureDepth(
  node: SelectionSetNode,
  fragments: Record<string, FragmentDefinitionNode>,
  currentDepth: number
): number {
  let max = currentDepth;

  for (const selection of node.selections) {
    if (selection.kind === 'Field') {
      const field = selection as FieldNode;
      if (field.selectionSet) {
        const childDepth = measureDepth(field.selectionSet, fragments, currentDepth + 1);
        if (childDepth > max) max = childDepth;
      }
    } else if (selection.kind === 'InlineFragment') {
      const inline = selection as InlineFragmentNode;
      if (inline.selectionSet) {
        const childDepth = measureDepth(inline.selectionSet, fragments, currentDepth);
        if (childDepth > max) max = childDepth;
      }
    } else if (selection.kind === 'FragmentSpread') {
      const fragment = fragments[selection.name.value];
      if (fragment?.selectionSet) {
        const childDepth = measureDepth(fragment.selectionSet, fragments, currentDepth);
        if (childDepth > max) max = childDepth;
      }
    }
  }

  return max;
}

function countAliases(document: DocumentNode): number {
  let count = 0;
  function walk(node: SelectionSetNode) {
    for (const selection of node.selections) {
      if (selection.kind === 'Field') {
        if ((selection as FieldNode).alias) count++;
        if ((selection as FieldNode).selectionSet) walk((selection as FieldNode).selectionSet!);
      } else if (selection.kind === 'InlineFragment') {
        if ((selection as InlineFragmentNode).selectionSet) {
          walk((selection as InlineFragmentNode).selectionSet!);
        }
      }
    }
  }
  for (const def of document.definitions) {
    if (def.kind === 'OperationDefinition' && (def as OperationDefinitionNode).selectionSet) {
      walk((def as OperationDefinitionNode).selectionSet);
    }
  }
  return count;
}

export function depthLimitPlugin(options: DepthLimitOptions = {}): ApolloServerPlugin {
  const maxDepth = options.maxDepth ?? 7;
  const maxAliases = options.maxAliases ?? 10;

  return {
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      return {
        async didResolveOperation({ document, operation }) {
          if (!operation) {
            throw new GraphQLError('Operation is required');
          }

          // Build fragment map for spread resolution
          const fragments: Record<string, FragmentDefinitionNode> = {};
          for (const def of document.definitions) {
            if (def.kind === 'FragmentDefinition') {
              fragments[(def as FragmentDefinitionNode).name.value] = def as FragmentDefinitionNode;
            }
          }

          // Check depth
          const depth = measureDepth(operation.selectionSet, fragments, 1);
          if (depth > maxDepth) {
            throw new GraphQLError(
              `Query depth of ${depth} exceeds the maximum allowed depth of ${maxDepth}.`,
              { extensions: { code: 'QUERY_TOO_DEEP', depth, maxDepth } }
            );
          }

          // Check aliases
          const aliases = countAliases(document);
          if (aliases > maxAliases) {
            throw new GraphQLError(
              `Query contains ${aliases} aliases, exceeding the maximum of ${maxAliases}.`,
              { extensions: { code: 'TOO_MANY_ALIASES', aliases, maxAliases } }
            );
          }
        },
      };
    },
  };
}
