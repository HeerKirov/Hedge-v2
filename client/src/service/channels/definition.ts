import { ServiceContext, ServiceOptions } from "../index"
import { StatusCode } from "../code"

/**
 * 一个channel分组。
 */
export interface Scope {
    /**
     * 组名。可以省略，省略时组名记作''。
     */
    name?: string
    /**
     * 对web开放接口。默认是开放的。
     */
    forWeb?: boolean
    /**
     * 该组下所有的channel的构造器。
     */
    channels: ChannelConstructor<any, any, any>[]
}

/**
 * 一个channel的构造器。
 */
export type ChannelConstructor<META, IN, OUT> = (context: ServiceContext, options: ServiceOptions) => Channel<META, IN, OUT>

/**
 * 一个channel的构造实例。
 */
interface Channel<META, IN, OUT> {
    /**
     * channel名称。
     */
    name: string
    /**
     * channel方法名。名称+方法名唯一确定一个方法。可以省略，省略时方法名记作''。
     */
    method?: string
    /**
     * 对web开放接口。默认是开放的。
     */
    forWeb?: boolean
    /**
     * 指定此方法以执行调用前校验。
     * @return 返回{null}表示校验通过。返回code+msg表示校验不通过。
     */
    validate?: ValidateMethod<META, IN>
    /**
     * 异步方法体。
     * @return 执行结果
     * @throws 抛出异常
     */
    invoke?(meta: META, req: IN): Promise<OUT>
    /**
     * 同步方法体。
     * @return 执行结果
     * @throws 抛出异常
     */
    invokeSync?(meta: META, req: IN): OUT
}

export interface ValidateMethod<META, IN> { (meta: META, req: IN): {code?: StatusCode, msg?: string} | null | undefined }
