import { NextResponse } from 'next/server';

const JOINT_MATERIALS = [
  {
    id: "adobe",
    name: "Adobe",
    thumbnailPath: "/Joints-Patterns/Adobe.jpg",
    renderPath: "/Joints-Patterns/Adobe.jpg",
    mimeType: "image/jpeg"
  },
  {
    id: "rough-concrete",
    name: "Rough Concrete",
    thumbnailPath: "/Joints-Patterns/Rough-Concrete.jpg",
    renderPath: "/Joints-Patterns/Rough-Concrete.jpg",
    mimeType: "image/jpeg"
  },
  {
    id: "coarse-cement",
    name: "Coarse Cement",
    thumbnailPath: "/Joints-Patterns/coarse-cement.jpg",
    renderPath: "/Joints-Patterns/coarse-cement.jpg",
    mimeType: "image/jpeg"
  },
  {
    id: "mortar",
    name: "Mortar",
    thumbnailPath: "/Joints-Patterns/mortar.jpg",
    renderPath: "/Joints-Patterns/mortar.jpg",
    mimeType: "image/jpeg"
  }
];

export async function GET() {
  return NextResponse.json(JOINT_MATERIALS);
}
