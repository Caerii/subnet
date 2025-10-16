import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { collectionsTable, agentsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/collections/[id] - Get a specific collection with its agents
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const collectionId = parseInt(id);

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    // Get the collection
    const [collection] = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .limit(1);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Get agents in this collection
    const agents = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.collectionId, collectionId));

    const mappedCollection = {
      id: collection.id.toString(),
      name: collection.name,
      description: collection.description,
      color: collection.color || '#3b82f6',
      createdAt: collection.createdAt?.toISOString(),
      agents: agents.map((agent) => ({
        id: agent.id.toString(),
        title: agent.name,
        description: agent.description,
        prompt: agent.prompt,
        tools: (agent.tools as string[]) || [],
        collectionId: agent.collectionId?.toString(),
        createdAt: agent.createdAt?.toISOString(),
      })),
    };

    return NextResponse.json(mappedCollection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

// DELETE /api/collections/[id] - Delete a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const collectionId = parseInt(id);

    if (isNaN(collectionId)) {
      return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 });
    }

    // First, remove collectionId from all agents in this collection
    await db
      .update(agentsTable)
      .set({ collectionId: null })
      .where(eq(agentsTable.collectionId, collectionId));

    // Then delete the collection
    const [deletedCollection] = await db
      .delete(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .returning();

    if (!deletedCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
