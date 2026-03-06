import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function OPTIONS(req) {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req, { params }) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }
  const { id } = await params;
  try {
    const client = await getClientPromise();
    const db = client.db("exam-library");
    const book = await db.collection("book").findOne({ _id: new ObjectId(id) });
    return NextResponse.json(book, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req, { params }) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: corsHeaders });
  }
  const { id } = await params;
  try {
    const data = await req.json();
    const client = await getClientPromise();
    const db = client.db("exam-library");
    const result = await db.collection("book").updateOne({ _id: new ObjectId(id) }, { $set: data });
    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req, { params }) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: corsHeaders });
  }
  const { id } = await params;
  try {
    const client = await getClientPromise();
    const db = client.db("exam-library");
    const result = await db.collection("book").updateOne({ _id: new ObjectId(id) }, { $set: { status: "DELETED" } });
    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}