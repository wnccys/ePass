import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateSiweNonce } from "viem/siwe";

export async function GET() {
    const nonce = generateSiweNonce();

    (await cookies()).set('siwe_nonce', nonce, { httpOnly: true, secure: true });

    return NextResponse.json( { nonce });
}