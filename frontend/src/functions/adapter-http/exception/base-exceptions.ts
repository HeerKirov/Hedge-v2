
export interface BaseException<S extends number, C extends string, I> {
    status: S
    code: C
    message: string
    info: I
}

export type BadRequestException<C extends string, I> = BaseException<400, C, I>

export type UnauthorizedException<C extends string, I> = BaseException<401, C, I>

export type ForbiddenException<C extends string, I> = BaseException<403, C, I>

export type NotFoundException<C extends string, I> = BaseException<404, C, I>

export type InternalError = BaseException<500, "INTERNAL_ERROR", null>

export type UnknownError = BaseException<number, "UNKNOWN_ERROR", null>