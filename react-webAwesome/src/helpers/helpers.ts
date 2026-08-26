export const labelFromHref = (href: string, defaultLabel: string) => {
  const name = href.replace(/^\//, "") || "home";
  return name.charAt(0).toUpperCase() + name.slice(1);
};
