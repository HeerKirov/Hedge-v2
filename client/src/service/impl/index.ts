import { ServiceContext, ServiceOptions } from "../index"
import {StatusCode} from "../code";

export type ChannelConstructor<META, IN, OUT> = (context: ServiceContext, options: ServiceOptions) => Channel<META, IN, OUT>

/**
 * 一个channel分组。
 */
export interface Scope {
    /**
     * 组名。可以省略。
     */
    name?: string
    /**
     * 该组下所有的channel的构造器。
     */
    channels: ChannelConstructor<any, any, any>[]
}

export interface Channel<META, IN, OUT> {
    /**
     * channel名称。
     */
    name: string
    /**
     * channel方法名。名称+方法名唯一确定一个方法。
     */
    method?: string
    /**
     * 指定此方法以执行调用前校验。
     * @return 返回{null}表示校验通过。返回code+msg表示校验不通过。
     */
    validate?(meta: META, req: IN): {code?: StatusCode, msg?: string} | null | undefined
    /**
     * 方法体。
     * @return 执行结果
     * @throws 抛出异常
     */
    call(meta: META, req: IN): Promise<OUT>
}

export const scopes: Scope[] = [

]
