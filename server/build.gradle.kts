plugins {
    application
    kotlin("jvm").version("1.4.32")
    id("com.github.johnrengelman.shadow").version("4.0.3")
    id("org.beryx.jlink").version("2.22.1")
}

group = "com.heerkirov.hedge.server"
version = "0.1.0"

dependencies {
    val kotlinVersion = "1.4.32"
    val javalinVersion = "3.13.4"
    val ktormVersion = "3.4.1"
    val sqliteVersion = "3.32.3.2"
    val jacksonVersion = "2.11.3" //be careful to update version
    val javeVersion = "3.1.1"
    val plistVersion = "1.23"
    val slf4jVersion = "1.7.30"
    val junitVersion = "4.13.1"

    implementation(group = "org.jetbrains.kotlin", name = "kotlin-stdlib-jdk8", version = kotlinVersion)
    implementation(group = "org.jetbrains.kotlin", name = "kotlin-reflect", version = kotlinVersion)
    implementation(group = "com.fasterxml.jackson.core", name = "jackson-core", version = jacksonVersion)
    implementation(group = "com.fasterxml.jackson.module", name = "jackson-module-kotlin", version = jacksonVersion)
    implementation(group = "org.xerial", name = "sqlite-jdbc", version = sqliteVersion)
    implementation(group = "org.ktorm", name = "ktorm-core", version = ktormVersion)
    implementation(group = "org.ktorm", name = "ktorm-support-sqlite", version = ktormVersion)
    implementation(group = "io.javalin", name = "javalin", version = javalinVersion)
    implementation(group = "ws.schild", name = "jave-core", version = javeVersion)
    implementation(group = "ws.schild", name = "jave-nativebin-osx64", version = javeVersion)
    implementation(group = "com.googlecode.plist", name = "dd-plist", version = plistVersion)
    implementation(group = "org.slf4j", name = "slf4j-simple", version = slf4jVersion)
    implementation(group = "org.slf4j", name = "slf4j-api", version = slf4jVersion)
    testImplementation(group = "org.jetbrains.kotlin", name = "kotlin-test-junit", version = kotlinVersion)
    testImplementation(group = "junit", name = "junit", version = junitVersion)
}

val javaVersion = "11"
val projectMainModule = "com.heerkirov.hedge.server"
val projectMainClass = "com.heerkirov.hedge.server.ApplicationKt"
val projectBinaryName = "hedge-v2-server"

application {
    @Suppress("DEPRECATION")
    mainClassName = "${projectMainModule}/${projectMainClass}"
    mainClass.set(projectMainClass)
    mainModule.set(projectMainModule)
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}


repositories {
    mavenCentral()
    jcenter()
}

sourceSets {
    //使开发模式下的gradle能正确处理资源文件的位置，防止读取不到
    main.configure {
        output.setResourcesDir(java.outputDir)
    }
}

tasks {
    compileJava {
        doFirst {
            options.compilerArgs = listOf("--module-path", classpath.asPath)
        }
    }
    compileKotlin {
        kotlinOptions.jvmTarget = javaVersion
        kotlinOptions.freeCompilerArgs = listOf("-Xinline-classes") //启用inline class实验特性
    }
    compileTestKotlin {
        kotlinOptions.jvmTarget = javaVersion
    }
    compileKotlin.get().destinationDir = compileJava.get().destinationDir

    shadowJar {
        manifestContentCharset = "utf-8"
        setMetadataCharset("utf-8")
        manifest {
            attributes(mapOf("Main-Class" to projectMainClass))
        }
    }
}

jlink {
    options.set(listOf("--strip-debug", "--compress", "2", "--no-header-files", "--no-man-pages"))
    launcher {
        name = projectBinaryName
    }
    mergedModule {
        additive = true
        /* 存在一个jlink插件auto merge non-module代码时的问题。
         * 新的java版本采用uses在module中声明服务发现的implement。对于non-module的代码，jlink插件会自动把它们打包成一个merged-module。
         * 但是，kotlin-reflect内有一些ServiceLoader的uses没有被自动分析进merged module里，因此造成了一个module * does not declare `uses`的异常。
         * tips: 在additive=true时，不必携带全部DSL，jlink命令的:createMergedModule阶段仍会报warn，但不会影响构建。
         */
        uses("kotlin.reflect.jvm.internal.impl.resolve.ExternalOverridabilityCondition")
        uses("kotlin.reflect.jvm.internal.impl.util.ModuleVisibilityHelper")
        uses("kotlin.reflect.jvm.internal.impl.builtins.BuiltInsLoader")
    }
}