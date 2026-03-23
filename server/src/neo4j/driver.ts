import neo4j, { Driver, Record as Neo4jRecord, Node, Integer } from 'neo4j-driver';

let _driver: Driver | null = null;

export function getDriver(): Driver {
  if (!_driver) {
    _driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
    );
  }
  return _driver;
}

export async function runQuery(
  driver: Driver,
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<Neo4jRecord[]> {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params, { timeout: 5000 });
    return result.records;
  } finally {
    await session.close();
  }
}

// Neo4j temporal types
interface Neo4jDate  { year: Integer; month: Integer; day: Integer }
interface Neo4jDateTime { epochMillis: Integer }

type Neo4jPropertyValue =
  | Integer
  | Neo4jDate
  | Neo4jDateTime
  | string
  | number
  | boolean
  | null
  | string[];

export function toObject<T = Record<string, unknown>>(node: Node): T {
  const props = node.properties as Record<string, Neo4jPropertyValue>;
  const out: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(props)) {
    if (val === null || val === undefined) {
      out[key] = val;
    } else if (neo4j.isInt(val as Integer)) {
      out[key] = (val as Integer).toNumber();
    } else if (
      typeof val === 'object' &&
      !Array.isArray(val) &&
      'year' in val &&
      'month' in val &&
      'day' in val
    ) {
      const d = val as Neo4jDate;
      out[key] = `${d.year.toNumber()}-${String(d.month.toNumber()).padStart(2, '0')}-${String(d.day.toNumber()).padStart(2, '0')}`;
    } else if (
      typeof val === 'object' &&
      !Array.isArray(val) &&
      'epochMillis' in val
    ) {
      out[key] = new Date((val as Neo4jDateTime).epochMillis.toNumber()).toISOString();
    } else {
      out[key] = val;
    }
  }

  return out as T;
}
