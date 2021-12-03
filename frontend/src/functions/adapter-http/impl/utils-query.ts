import { HttpInstance, Response } from ".."
import { TagType } from "./tag"

export function createUtilQueryEndpoint(http: HttpInstance): UtilQueryEndpoint {
    return {
        querySchema: http.createDataRequest("/api/utils/query/schema", "POST")
    }
}

export interface UtilQueryEndpoint {
    querySchema(form: QueryForm): Promise<Response<QueryRes>>
}

export type Dialect = "ILLUST" | "ALBUM" | "SOURCE_IMAGE"

export interface QueryForm {
    text: string
    dialect: Dialect
}

export interface QueryRes {
    queryPlan: QueryPlan | null
    warnings: CompileError[]
    errors: CompileError[]
}

export interface QueryPlan {
    orders: string[]
    elements: Element[]
    filters: FilterItem[]
}

export type Element = { type: "name", intersectItems: ElementItem<ElementString>[] }
    | { type: "annotation", intersectItems: ElementItem<ElementAnnotation>[] }
    | { type: "meta-tag", intersectItems: ElementItem<ElementTopic | ElementAuthor | ElementTag>[] }
    | { type: "source-tag", intersectItems: ElementItem<ElementSourceTag>[] }
export interface ElementItem<V> { exclude: boolean, unionItems: V[] }
export type ElementValue = ElementString | ElementSourceTag | ElementAnnotation | ElementTopic | ElementAuthor | ElementTag
interface ElementString { type: undefined, value: string, precise: boolean }
interface ElementSourceTag { type: "source-tag", id: number, name: string }
interface ElementAnnotation { type: "annotation", id: number, name: string }
interface ElementTopic { type: "topic", id: number, name: string, color: string | null }
interface ElementAuthor { type: "author", id: number, name: string, color: string | null }
interface ElementTag { type: "tag", id: number, name: string, tagType: TagType, color: string | null, realTags: { id: number, name: string, tagType: TagType }[] }

export interface FilterItem { exclude: boolean, fields: FilterOfOneField[] }
export interface FilterOfOneField { name: string, values: FilterValue[] }
export type FilterValue = { type: "equal", value: string | number }
    | { type: "match", value: string | number }
    | { type: "range", begin: string | number | null, end: string | number | null, includeBegin: boolean, includeEnd: boolean }

//=== 编译错误和警告 ===

export type CompileError = NormalCharacterEscaped
    | ExpectQuoteButEOF
    | ExpectEscapedCharacterButEOF
    | UselessSymbol
    | UnexpectedToken
    | UnexpectedEOF
    | DuplicatedAnnotationPrefix

interface CompileErrorTemplate<C extends number, I> {
    code: C
    message: string
    happenPosition: IndexRange | null
    info: I
}

interface IndexRange {
    begin: number
    end: number | null
}

//=== 词法分析错误 ===

/**
 * 转义了一个普通字符，而非需要被转义的符号。
 * info: 这个普通字符char
 */
type NormalCharacterEscaped = CompileErrorTemplate<1001, string>

/**
 * 希望遇到字符串终结符，但是却遇到了字符串末尾。终结符丢失。
 * info: 这个字符串符号quote
 */
type ExpectQuoteButEOF = CompileErrorTemplate<1002, string>

/**
 * 希望在转义字符后遇到一个符号用于转义，但是却遇到了字符串末尾。转义符号丢失。
 */
type ExpectEscapedCharacterButEOF = CompileErrorTemplate<1003, null>

/**
 * 遇到了意料之外的符号，此符号在词法中没有任何作用，因此将被忽略掉。
 * info: 这个没用的符号char
 */
type UselessSymbol = CompileErrorTemplate<1004, string>

//=== 语法分析错误 ===

/**
 * 遇到了预料之外的token。
 * info: 实际遇到的词素 & 此位置能接受的下一个词素
 */
type UnexpectedToken = CompileErrorTemplate<2001, {actual: string, expected: string[]}>

/**
 * 遇到了预料之外的结束EOF。
 * info: 实际遇到的词素(EOF) & 此位置能接受的下一个词素
 */
type UnexpectedEOF = CompileErrorTemplate<2001, {actual: "∑", expected: string[]}>

/**
 * 在注解中存在重复出现的前缀符号。
 * info: 词重复符号symbol
 */
type DuplicatedAnnotationPrefix = CompileErrorTemplate<2001, string>

//=== 语义分析错误 ===

//TODO 补全所有编译错误
