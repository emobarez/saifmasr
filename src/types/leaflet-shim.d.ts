// Shim to prevent TypeScript resolution errors when dynamic importing leaflet in client-only components
// Actual types are provided by @types/leaflet at build time; this guards optional edge/runtime bundling.
declare module 'leaflet';
