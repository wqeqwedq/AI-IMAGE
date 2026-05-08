import { randomInt } from "node:crypto";

/** 与数据库 redeem 校验一致：不含 0、O、1、I、L */
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function randomRedeemCode(length: number): string {
    const n = Math.min(32, Math.max(1, Math.floor(length)));
    let out = "";
    for (let i = 0; i < n; i++) {
        out += CHARSET[randomInt(CHARSET.length)];
    }
    return out;
}
