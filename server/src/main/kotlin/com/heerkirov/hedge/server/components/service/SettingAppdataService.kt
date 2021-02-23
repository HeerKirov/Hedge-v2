package com.heerkirov.hedge.server.components.service

import com.heerkirov.hedge.server.components.appdata.*
import com.heerkirov.hedge.server.form.BackupOptionUpdateForm
import com.heerkirov.hedge.server.form.ProxyOptionUpdateForm
import com.heerkirov.hedge.server.form.WebOptionUpdateForm

class SettingAppdataService(private val appdata: AppDataDriver) {
    fun getWeb(): WebOption {
        return appdata.data.web
    }

    fun updateWeb(form: WebOptionUpdateForm) {
        appdata.save {
            form.autoWebAccess.alsoOpt { web.autoWebAccess = it }
            form.permanent.alsoOpt { web.permanent = it }
            form.password.alsoOpt { web.password = it }
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

    fun getBackup(): BackupOption {
        return appdata.data.backup
    }

    fun updateBackup(form: BackupOptionUpdateForm) {
        appdata.save {
            form.path.alsoOpt { backup.path = it }
            form.autoBackup.alsoOpt { backup.autoBackup = it }
        }
    }

    fun getDb(): DBOption {
        return appdata.data.db
    }
}