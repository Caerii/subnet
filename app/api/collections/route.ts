import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { collectionsTable, agentsTable } from '@/db/schema';
import { desc, count, eq, and } from 'drizzle-orm';

// GET /api/collections - Get all collections with agent counts
export async function GET() {
  try {
    const collections = await db.select().from(collectionsTable).orderBy(desc(collectionsTable.id));

    // Get agent counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const [agentCount] = await db
          .select({ count: count() })
          .from(agentsTable)
          .where(eq(agentsTable.collectionId, collection.id));

        return {
          id: collection.id.toString(),
          name: collection.name,
          description: collection.description,
          color: collection.color || '#3b82f6',
          createdAt: collection.createdAt?.toISOString(),
          agentCount: agentCount?.count || 0,
        };
      }),
    );

    return NextResponse.json(collectionsWithCounts);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, replaceExisting } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if a collection with this name already exists
    const existingCollection = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.name, name.trim()))
      .limit(1);

    if (existingCollection.length > 0) {
      if (replaceExisting) {
        // Replace the existing collection
        const [updatedCollection] = await db
          .update(collectionsTable)
          .set({
            description: description.trim(),
            color: color || '#3b82f6',
          })
          .where(eq(collectionsTable.id, existingCollection[0].id))
          .returning();

        const mappedCollection = {
          id: updatedCollection.id.toString(),
          name: updatedCollection.name,
          description: updatedCollection.description,
          color: updatedCollection.color || '#3b82f6',
          createdAt: updatedCollection.createdAt?.toISOString(),
          agentCount: 0, // Will be updated by the client
        };

        return NextResponse.json(mappedCollection, { status: 200 });
      } else {
        return NextResponse.json(
          {
            error: 'Collection name already exists',
            existingCollection: {
              id: existingCollection[0].id.toString(),
              name: existingCollection[0].name,
              description: existingCollection[0].description,
              color: existingCollection[0].color || '#3b82f6',
            },
          },
          { status: 409 },
        );
      }
    }

    // Create new collection
    const [newCollection] = await db
      .insert(collectionsTable)
      .values({
        name: name.trim(),
        description: description.trim(),
        color: color || '#3b82f6',
      })
      .returning();

    const mappedCollection = {
      id: newCollection.id.toString(),
      name: newCollection.name,
      description: newCollection.description,
      color: newCollection.color || '#3b82f6',
      createdAt: newCollection.createdAt?.toISOString(),
      agentCount: 0,
    };

    return NextResponse.json(mappedCollection, { status: 201 });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
