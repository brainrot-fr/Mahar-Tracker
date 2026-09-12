const databaseUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;

export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

const globalRef = globalThis as typeof globalThis & {
  __supabaseSqlPromise__?: Promise<Sql>;
};

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (value: string) => value;
type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let index = 0; index < values.length; index += 1) {
      text += `$${index + 1}${strings[index + 1] ?? ""}`;
    }
    return run<T>(text, values);
  }) as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => run<T>(text, params);
  return sql;
}

async function createSupabaseSql(): Promise<Sql> {
  if (!databaseUrl) throw new Error("Missing SUPABASE_DB_URL");
  const parsedUrl = new URL(databaseUrl);
  if (/^db\.[^.]+\.supabase\.co$/i.test(parsedUrl.hostname) || parsedUrl.port === "5432") {
    throw new Error(
      "SUPABASE_DB_URL uses Supabase's direct database endpoint. Copy the IPv4 transaction-pooler URL " +
        "from Supabase Connect instead; it uses a *.pooler.supabase.com hostname and port 6543.",
    );
  }
  globalRef.__supabaseSqlPromise__ ??= (async () => {
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool(
      {
        connectionString: databaseUrl,
        family: 4,
        connectionTimeoutMillis: 10_000,
      } as ConstructorParameters<typeof Pool>[0] & { family: 4 },
    );
    return toSql(async <T>(text: string, params: unknown[]) => {
      try {
        const result = await pool.query(text, params);
        return result.rows as T[];
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        if (code === "ENETUNREACH" || code === "ENETDOWN" || code === "EHOSTUNREACH") {
          throw new Error(
            "Supabase Postgres is unreachable. Use the IPv4 transaction-pooler URL from Supabase Connect " +
              "(port 6543), URL-encode special characters in its password, and restart the dev server.",
            { cause: error },
          );
        }
        throw error;
      }
    });
  })().catch((error) => {
    globalRef.__supabaseSqlPromise__ = undefined;
    throw error;
  });
  return globalRef.__supabaseSqlPromise__;
}

let sqlPromise: Promise<Sql> | null = null;

export function getSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error("@/lib/db is server-only");
  }
  sqlPromise ??= createSupabaseSql().catch((error) => {
    sqlPromise = null;
    throw error;
  });
  return sqlPromise;
}

export function ensureDbReady(): Promise<void> {
  return Promise.resolve();
}
