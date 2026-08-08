import type {
    JwtAlgorithmNotImplemented,
    JwtTokenExpired,
    JwtTokenInvalid,
    JwtTokenIssuedAt,
    JwtTokenNotBefore,
    JwtTokenSignatureMismatched,
} from 'hono/utils/jwt/types';
import type { Role } from '../../features/auth/types.js';

//Token generation context
export type TokenPayload = {
    deviceHash: string
    sub: number
    role: Role
    iss: string
    exp: number
}

export type TokenPayloadParameter = Omit<TokenPayload, "iss" | "exp">

export type JwtErrorConstructor =
    | typeof JwtAlgorithmNotImplemented
    | typeof JwtTokenInvalid
    | typeof JwtTokenExpired
    | typeof JwtTokenIssuedAt
    | typeof JwtTokenNotBefore
    | typeof JwtTokenSignatureMismatched;
//