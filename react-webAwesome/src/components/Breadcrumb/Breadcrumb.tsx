// Breadcrumb.tsx

import { WaBreadcrumb, WaBreadcrumbItem } from "@/WebAwesome";
import { labelFromHref } from "@/helpers/helpers";
import type { BreadcrumbProps } from "@/types";

const Breadcrumb = ({ homeHref, pageHref }: BreadcrumbProps) => {
  return (
    <WaBreadcrumb slot="breadcrumb">
      <WaBreadcrumbItem href={homeHref}>{labelFromHref(homeHref, "")}</WaBreadcrumbItem>
      <WaBreadcrumbItem href={pageHref}>{labelFromHref(pageHref, "page")}</WaBreadcrumbItem>
    </WaBreadcrumb>
  );
};

export default Breadcrumb;
