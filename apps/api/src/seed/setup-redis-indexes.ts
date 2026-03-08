import { initializeRedisClient } from "../utils/client";
import { getKeyName, restaurantsIndexKey } from "../utils/keys";
import { SCHEMA_FIELD_TYPE } from "redis";

async function createIndex() {
  const client = await initializeRedisClient();

  try {
    await client.ft.dropIndex(restaurantsIndexKey);
  } catch (err) {
    console.log("No existing index to delete");
  }

  await client.ft.create(
    restaurantsIndexKey,
    {
      id: {
        type: SCHEMA_FIELD_TYPE.TEXT,
        AS: "id",
      },
      name: {
        type: SCHEMA_FIELD_TYPE.TEXT,
        AS: "name",
        SORTABLE: true,
      },
      location: {
        type: SCHEMA_FIELD_TYPE.TEXT,
        AS: "location",
        SORTABLE: true,
      },
      ownerId: {
        type: SCHEMA_FIELD_TYPE.TEXT,
        AS: "ownerId",
        SORTABLE: true,
      },
      avgStars: {
        type: SCHEMA_FIELD_TYPE.NUMERIC,
        AS: "avgStars",
        SORTABLE: true,
      },
      viewCount: {
        type: SCHEMA_FIELD_TYPE.NUMERIC,
        AS: "viewCount",
        SORTABLE: true,
      },
      status: {
        type: SCHEMA_FIELD_TYPE.TAG,
        AS: "status",
      },
    },
    {
      ON: "HASH",
      PREFIX: getKeyName("restaurants"),
    },
  );
}

await createIndex();
process.exit();
