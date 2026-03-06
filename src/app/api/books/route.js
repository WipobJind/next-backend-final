import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

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

    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "";
    const author = searchParams.get("author") || "";

    let filter = {};

    if (user.role !== "ADMIN") {
      filter.status = { $ne: "DELETED" };
    }

    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }
    if (author) {
      filter.author = { $regex: author, $options: "i" };
    }

    const books = await db.collection("book").find(filter).toArray();
    return NextResponse.json(books, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403, headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const { title, author, quantity, location } = data;

    const client = await getClientPromise();
    const db = client.db("exam-library");
    const result = await db.collection("book").insertOne({
      title,
      author,
      quantity: quantity || 0,
      location: location || "",
      status: "ACTIVE"
    });
    return NextResponse.json({ id: result.insertedId }, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}