package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.appdata.*
import com.heerkirov.hedge.server.components.http.WebController
import com.heerkirov.hedge.server.form.ProxyOptionUpdateForm
import com.heerkirov.hedge.server.form.WebOptionRes
import com.heerkirov.hedge.server.form.WebOptionUpdateForm

class SettingAppdataService(private val appdata: AppDataDriver, private val webController: WebController) {
    fun getWeb(): WebOptionRes {
        return WebOptionRes(appdata.data.web.autoWebAccess, appdata.data.web.permanent, appdata.data.web.password, webController.isAccess)
    }

    fun updateWeb(form: WebOptionUpdateForm) {
        if(form.autoWebAccess.isPresent || form.permanent.isPresent || form.password.isPresent) {
            appdata.save {
                form.autoWebAccess.alsoOpt { web.autoWebAccess = it }
                form.permanent.alsoOpt { web.permanent = it }
                form.password.alsoOpt { web.password = it }
            }
        }
        form.access.alsoOpt {
            webController.isAccess = it
        }
    }

    fun getService(): ServiceOption {
        return appdata.data.service
    }

    fun updateService(form: ServiceOption) {
        appdata.save {
            service.port = form.port
        }
    }

    fun getProxy(): ProxyOption {
        return appdata.data.proxy
    }

    fun updateProxy(form: ProxyOptionUpdateForm) {
        appdata.save {
            form.httpProxy.alsoOpt { proxy.httpProxy = it }
            form.socks5Proxy.alsoOpt { proxy.socks5Proxy = it }
        }
    }
}