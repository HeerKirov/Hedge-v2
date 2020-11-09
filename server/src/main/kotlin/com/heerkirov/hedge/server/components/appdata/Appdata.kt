package com.heerkirov.hedge.server.components.appdata

import com.heerkirov.hedge.server.framework.Component

interface Appdata : Component {

}

data class AppdataOptions(
    val channel: String,
    val userDataPath: String
)

class AppdataImpl(options: AppdataOptions) : Appdata {

}