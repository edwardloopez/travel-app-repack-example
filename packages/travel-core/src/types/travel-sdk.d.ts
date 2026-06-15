declare module 'travel-sdk/lib/remotesCatalog.json' {
  const catalog: Record<
    string,
    { slug: string; devPort: number; version: string }
  >;
  export default catalog;
}
