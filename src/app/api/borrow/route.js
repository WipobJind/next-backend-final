import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function OPTIONS(req) {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }
  try {
    const client = await getClientPromise();
    const db = client.db("exam-library");

    let filter = {};
    if (user.role !== "ADMIN") {
      filter.userId = user.id;
    }

    const requests = await db.collection("borrow").find(filter).toArray();
    return NextResponse.json(requests, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const { bookId, targetDate } = data;

    const client = await getClientPromise();
    const db = client.db("exam-library");

    const result = await db.collection("borrow").insertOne({
      userId: user.id,
      userEmail: user.email,
      bookId,
      createdAt: new Date().toISOString(),
      targetDate,
      status: "INIT"
    });
    return NextResponse.json({ id: result.insertedId }, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const { borrowId, status } = data;

    const validStatuses = ["INIT", "CLOSE-NO-AVAILABLE-BOOK", "ACCEPTED", "CANCEL-ADMIN", "CANCEL-USER"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400, headers: corsHeaders });
    }

    if (user.role !== "ADMIN") {
      if (status !== "CANCEL-USER") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: corsHeaders });
      }
      const client = await getClientPromise();
      const db = client.db("exam-library");
      const borrow = await db.collection("borrow").findOne({ _id: new ObjectId(borrowId) });
      if (borrow.userId !== user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: corsHeaders });
      }
    }

    const client = await getClientPromise();
    const db = client.db("exam-library");
    const result = await db.collection("borrow").updateOne(
      { _id: new ObjectId(borrowId) },
      { $set: { status } }
    );
    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}