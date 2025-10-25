/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/unimake_backend.json`.
 */
export type UnimakeBackend = {
  address: "CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG";
  metadata: {
    name: "unimakeBackend";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: Array<any>;
  accounts: Array<any>;
  events: Array<any>;
  errors: Array<any>;
  types: Array<any>;
};
