import { AccessTokenPayload } from "./access-token-payload";

export interface AuthenticatedRequest
extends Request {
    user:AccessTokenPayload
}