---
title: Builder 模式完全指南：从原理到 Android 实战
published: 2026-05-22
description: 深入解析 Builder 设计模式，涵盖原理、Kotlin 实现、Android 源码分析（AlertDialog、Retrofit、OkHttp）、面试题及实战练习
image: ''
tags: [设计模式, Android, Kotlin, 架构设计, 面试, 源码分析]
category: 设计模式
draft: false
lang: zh_CN
---

# Builder 模式

# 一、什么是 Builder 模式

Builder（建造者模式）是一种创建型设计模式。

核心目的：

> 将“复杂对象的创建过程”和“对象本身”分离。

Builder 模式特别适合：

- 构造参数很多
- 参数有可选项
- 需要链式调用
- 需要控制对象创建过程
- 希望代码更易读

---

# 二、为什么 Android 中大量使用 Builder

Android 开发里，很多对象参数极多。

例如：

```kotlin
AlertDialog.Builder(this)
    .setTitle("提示")
    .setMessage("确定删除吗？")
    .setPositiveButton("确定", null)
    .setNegativeButton("取消", null)
    .show()
```

如果不用 Builder：

```kotlin
AlertDialog(
    title,
    message,
    positive,
    negative,
    cancelable,
    icon,
    style,
    listener...
)
```

会出现：

- 参数爆炸
- 可读性极差
- 很容易写错
- 扩展困难

因此 Android 大量使用 Builder。

---

# 三、Builder 模式核心思想

Builder 模式主要包含：

| 角色 | 作用 |
|---|---|
| Product | 最终对象 |
| Builder | 建造过程 |
| Director（可选） | 指挥构建流程 |

---

# 四、最经典的 Builder 结构

```text
User.Builder()
    .setName()
    .setAge()
    .build()
```

本质：

```text
逐步配置
↓
最后统一创建对象
```

---

# 五、Android 实战：从零实现 Builder

# 需求

实现一个 User 类：

包含：

- name
- age
- phone
- address
- avatar

其中：

- name 必填
- age 可选
- phone 可选
- address 可选
- avatar 可选

---

# 六、传统写法的问题

```kotlin
class User(
    val name: String,
    val age: Int,
    val phone: String,
    val address: String,
    val avatar: String
)
```

创建对象：

```kotlin
val user = User(
    "Tom",
    18,
    "123",
    "Singapore",
    "avatar.png"
)
```

问题：

- 不知道每个参数是什么
- 参数顺序容易错
- 可选参数太多
- 可读性差

---

# 七、Builder 标准实现

```kotlin
class User private constructor(builder: Builder) {

    val name = builder.name
    val age = builder.age
    val phone = builder.phone
    val address = builder.address
    val avatar = builder.avatar

    class Builder(private val name: String) {

        var age: Int = 0
            private set

        var phone: String = ""
            private set

        var address: String = ""
            private set

        var avatar: String = ""
            private set

        fun setAge(age: Int) = apply {
            this.age = age
        }

        fun setPhone(phone: String) = apply {
            this.phone = phone
        }

        fun setAddress(address: String) = apply {
            this.address = address
        }

        fun setAvatar(avatar: String) = apply {
            this.avatar = avatar
        }

        fun build(): User {
            return User(this)
        }
    }
}
```

---

# 八、如何使用

```kotlin
val user = User.Builder("Tom")
    .setAge(18)
    .setPhone("123456")
    .setAddress("Singapore")
    .build()
```

优势：

- 可读性极高
- 参数不容易错
- 支持链式调用
- 可扩展性强

---

# 九、为什么 apply 可以链式调用

```kotlin
fun setAge(age: Int) = apply {
    this.age = age
}
```

apply 会返回当前对象。

因此：

```text
Builder
↓
Builder
↓
Builder
↓
build()
```

形成链式调用。

---

# 十、Builder 的本质

Builder 本质是：

```text
先配置
后创建
```

而不是：

```text
创建时一次性传全部参数
```

---

# 十一、Android 中 Builder 的经典案例

# 1. AlertDialog.Builder

```kotlin
AlertDialog.Builder(this)
    .setTitle("提示")
    .setMessage("是否退出")
    .show()
```

---

# 2. Retrofit.Builder

```kotlin
Retrofit.Builder()
    .baseUrl(BASE_URL)
    .addConverterFactory(GsonConverterFactory.create())
    .build()
```

---

# 3. OkHttpClient.Builder

```kotlin
OkHttpClient.Builder()
    .connectTimeout(10, TimeUnit.SECONDS)
    .readTimeout(10, TimeUnit.SECONDS)
    .build()
```

---

# 4. Notification.Builder

```kotlin
Notification.Builder(this)
    .setContentTitle("消息")
    .setContentText("内容")
    .build()
```

---

# 十二、Builder 与 Kotlin 的关系

很多人会问：

> Kotlin 已经支持默认参数了，还需要 Builder 吗？

例如：

```kotlin
class User(
    val name: String,
    val age: Int = 0,
    val phone: String = ""
)
```

创建：

```kotlin
val user = User(name = "Tom")
```

确实已经很方便。

但 Builder 依然重要。

因为：

- Java 兼容
- 链式 DSL 更清晰
- 参数特别多时更易读
- 可做参数校验
- 可控制创建流程
- 可做复杂构建逻辑

因此：

```text
简单对象 → 默认参数
复杂对象 → Builder
```

---

# 十三、Builder 模式的优点

| 优点 | 说明 |
|---|---|
| 可读性高 | 链式调用 |
| 参数顺序不重要 | 不容易写错 |
| 易扩展 | 新增参数不影响旧代码 |
| 支持复杂构建 | 可分步骤创建 |
| 封装创建逻辑 | 更安全 |

---

# 十四、Builder 模式缺点

| 缺点 | 说明 |
|---|---|
| 类会变多 | 增加代码量 |
| 简单对象可能过度设计 | 小对象没必要 |
| 学习成本略高 | 初学者理解成本 |

---

# 十五、什么时候使用 Builder

适合：

- 参数超过 4 个
- 有大量可选参数
- 链式 API
- 配置类对象
- 网络框架
- UI 配置
- SDK 设计

不适合：

- 简单数据类
- 参数很少
- 只创建一次的小对象

---

# 十六、面试高频问题

# 1. Builder 模式解决了什么问题？

答：

解决：

- 参数过多
- 构造函数复杂
- 可读性差
- 参数顺序容易错误

问题。

---

# 2. Builder 为什么适合 Android？

因为 Android：

- 配置项很多
- UI 参数很多
- SDK API 很复杂
- 大量链式调用

---

# 3. Builder 和工厂模式区别？

| Builder | Factory |
|---|---|
| 关注“如何一步步创建” | 关注“创建哪种对象” |
| 复杂对象构建 | 对象实例化 |
| 支持链式配置 | 隐藏创建逻辑 |

---

# 4. Builder 和 Kotlin 默认参数区别？

默认参数：

- 简单
- 轻量

Builder：

- 更适合复杂对象
- 更适合 DSL
- 更适合 SDK

---

# 十七、进阶：不可变对象 + Builder

大型项目推荐：

```kotlin
val 属性
```

不要：

```kotlin
var 属性
```

原因：

不可变对象：

- 更安全
- 线程安全更容易
- 更适合状态管理

Builder 负责创建。

对象创建后不可修改。

这是现代 Android 架构推荐方案。

---

# 十八、实战练习

# 练习 1（基础）

实现一个 Student.Builder。

要求：

属性：

- name
- age
- school
- grade

实现：

```kotlin
Student.Builder("Tom")
    .setAge(18)
    .setSchool("NUS")
    .build()
```

---

# 练习 2（中级）

实现一个 Dialog.Builder。

支持：

- title
- message
- positive
- negative
- cancelable

最后：

```kotlin
show()
```

---

# 练习 3（中高级）

实现一个 HttpRequest.Builder。

支持：

- url
- method
- header
- body
- timeout

最终：

```kotlin
execute()
```

---

# 练习 4（高级）

实现一个 RecyclerView Adapter Builder。

支持：

- layoutId
- data
- clickListener
- diffCallback

---

# 十九、源码阅读建议

建议重点阅读：

1. AlertDialog.Builder
2. Retrofit.Builder
3. OkHttpClient.Builder
4. Glide Builder
5. Notification.Builder

重点观察：

- 链式调用
- build() 最终创建
- 参数校验
- 默认配置
- 不可变对象

---

# 二十、Builder 最佳实践

# 推荐

```kotlin
fun setName(name: String) = apply {
    this.name = name
}
```

---

# 推荐

```kotlin
private constructor(builder: Builder)
```

防止绕过 Builder。

---

# 推荐

```kotlin
build() 中做参数校验
```

例如：

```kotlin
require(url.isNotEmpty())
```

---

# 推荐

```kotlin
对象创建后不可变
```

---

# 二十一、完整实战：网络请求 Builder

```kotlin
class HttpRequest private constructor(builder: Builder) {

    val url = builder.url
    val method = builder.method
    val timeout = builder.timeout

    class Builder {

        var url: String = ""
            private set

        var method: String = "GET"
            private set

        var timeout: Int = 10
            private set

        fun url(url: String) = apply {
            this.url = url
        }

        fun method(method: String) = apply {
            this.method = method
        }

        fun timeout(timeout: Int) = apply {
            this.timeout = timeout
        }

        fun build(): HttpRequest {
            require(url.isNotEmpty())
            return HttpRequest(this)
        }
    }
}
```

使用：

```kotlin
val request = HttpRequest.Builder()
    .url("https://api.test.com")
    .method("POST")
    .timeout(30)
    .build()
```

---

# 二十二、学习路线建议

建议顺序：

```text
Builder 基础
↓
链式调用
↓
Kotlin apply
↓
不可变对象
↓
DSL
↓
Retrofit Builder 源码
↓
OkHttp Builder 源码
```

---

# 二十三、总结

Builder 模式最核心的一句话：

> “把复杂对象的创建过程拆解成多个步骤。”

Android 中：

- AlertDialog
- Retrofit
- OkHttp
- Notification
- Glide

几乎都 heavily 使用 Builder。

掌握 Builder 后：

你会真正理解：

- 链式 API
- Kotlin DSL
- SDK 设计
- Android 架构设计
- 大型项目对象构建

这是 Android 中最值得深入掌握的设计模式之一。

