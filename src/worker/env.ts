export type AppEnv = {
  Bindings: {
    d1: D1Database;
    kv: KVNamespace;
    MY_BUCKET: R2Bucket;
    ASSETS: Fetcher;
  };
  Variables: {
    userId: string;
  };
};

export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};
