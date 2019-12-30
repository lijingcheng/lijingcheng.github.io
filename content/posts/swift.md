---
title: "从 Objective-C 过渡到 Swift"
date: 2017-03-17 19:10:37 +0800
draft: false
---

[Swift]() 不仅支持面向对象和面向协议开发，同时还支持函数式开发，在使用封装继承多态的同时，也可以用协议去组合代码，还可以利用高阶函数去简化代码、组织程序。面向协议开发不仅可以间接实现多继承，还可以使代码编写过程更加灵活，也能够解决面向对象开发带来的冗杂父类问题，在 Swift 中只有引用类型可以使用面向对象开发的继承功能，而引用类型的实例变量会在程序执行过程中因无意修改导致数据异常，此时可用协议替代继承，并且将引用类型改为值类型，便可以大大提高数据的安全性。

Swift 还是一个强类型语言，类型在运行时和编译期间是一致的，这样编译器可以得到足够的信息在生成中间码和机器码时进行优化，并在编译期间完成方法的绑定，可以直接获取方法地址并进行调用。

## Hello World

```swift
print("Hello world!") // 打印并换行
```

## 数据类型 
### 整数
通常使用 Int 来声明整数就可以了，当为了优化内存占用或要处理接口返回的长度明确的数据等情况时可使用显式指定长度的类型，这样可以及时发现值溢出并增强代码可读性。

```swift
let age: Int = 4 // 常量 age 在 32-bit 平台下为 Int32,在 64-bit 下为 Int64

var twoThousand = 2_000 // 变量 twoThousand 会被编译器自动推断为 Int 类型，并且用 _ 增强可读性
```

### 浮点数
32/64 位浮点数分别用 Float 和 Double 表示，精度分别为 6/15+ 位数字。

```swift
let pi = 3.14159 // 浮点数值总是会被推断为 Double

let a = Int(pi) // 自动截断，值为 3
let b = Int(exactly: pi) // 要求更为精确的转换，当精度有损失，认为转换失败，值为 nil
```

### 布尔值

```swift
let isChild: Bool = true // or false
```

### 字符
Character 类型通常由编码无关的 Unicode 字符组成

```swift
var c: Character = "e" // 如果不指定类型，双引号会被推断为字符串类型
```

Character 可以由一个或多个 Unicode 标量（Scalar）组成

```swift
var c1: Character = "\u{00E9}" // é

var c2: Character = "\u{0065}\u{0301}" // e +  ́ = é
```

### 字符串
Swift 中的 String 是值类型，所以在进行传递时都会进行值拷贝，不用担心会被意外修改。

```swift
let str: String = "Hello"

print("str: \(str)") // Swift 会用 str 的值替换占位符 \(str)
```

给字符串追加字符不一定会更改字符串的字符数量

```swift
var word = "cafe" + "\u{301}" // café

print(word.characters.count) // 有 4 个 char
print(word.unicodeScalars.count) // 有 5 个 Unicode Scalar
```

在 Swift 中不同的字符以及相同字符的不同表示方式可能需要不同数量的内存空间来存储，所以要知道字符的确定位置就必须从 String 开头遍历每一个 Unicode 标量直到结尾。因此 Swift 的字符串不能用整数做索引，而是使用一个关联的索引类型 String.Index，它对应着字符串中每一个字符的位置。

```swift
let greeting = "Guten Tag!"

print(greeting[greeting.startIndex])// 值为 G，如果用 greeting[0] 会报错
print(greeting[greeting.index(greeting.startIndex, offsetBy: 7)]) // a
```

### 数组
Array 使用有序列表存储同一类型的多个值，可以存储重复值。

```swift
var array1 = Array<String>() // 字符串数组

var array2 = [String]() // 字符串数组（推荐写法）

var array3 = Array(repeating: "_", count: 3) // 字符串数组，包含3个元素，默认值为 _

var array4 = ["apple", "pen", "apple-pen"] // 自动推断出数组类型为 String
array4 += ["Pineapple"] // 相同类型数组可以用 + 进行组合
array4.append("Pen") // 添加元素
array4[0] = "Apple" // 可以用下标访问和修改数组元素
array4[1...2] = ["Pen", "Apple-Pen"] // 还可以利用下标来一次改变一系列数据值，尽量保证下标区间与值的个数相匹配
```

使用 for-in 循环来遍历数组中的数据项

```swift
for item in array4 {}
```

如果我们同时需要每个数据项的值和索引值，可以使用 enumerated() 来进行数组遍历。enumerated() 返回一个由每一个数据项索引值和数据值组成的元组。

```swift
for (index, value) in array4.enumerated() {}
```

可以嵌套多对方括号来创建多维数组

```swift
var array3D: [[[Int]]] = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]

print(array3D[0])
print(array3D[0][1])
print(array3D[0][1][1])
```

### 集合
Set 用来存储相同类型并且没有确定顺序的值，不可以存储重复值。一个类型为了存储在集合中必须是可哈希化的，需要确认 Hashable 协议并提供方法来计算它的哈希值，因为 Hashable 符合 Equatable 协议，所以还需要提供 `==` 的实现。

```swift
var set1 = Set<String>() // 与数组不同的是集合的声明没有简化形式

var set2: Set = ["apple", "pen", "apple-pen"] // 如果不指定类型就会被认为是数组
set2.insert("pineapple")
```

按照特定顺序来遍历一个 Set 中的值可以使用 sorted() 方法，它将返回一个有序数组。

```swift
for item in set2.sorted() {}
```

### 字典
Dictionary 用来存储多个相同类型的值，每个值都关联唯一的 key，key 的类型必须遵循 Hashable 协议，字典中的数据项没有具体顺序。

```swift
var dict1 = Dictionary<Int, String>() // 键是Int型，值是String型

var dict2 = [Int: String]() //推荐写法
dict2[3] = "lijingcheng" // key: 3, value: lijingcheng 字典包含 key 时此操作为修改，否则为添加
dict2 = [:] // 赋值为空字典
```

遍历字典时每一个数据项都以 (key, value) 元组形式返回

```swift
for (key, value) in dict2 {}
```

### 元组
tuples 可以把多个不同类型的值组合成一个复合值，并且值是有序的，元组不支持 add 和 remove 操作，但是支持修改。元组并不适合创建复杂的数据结构，更适合用于组合少量的多元数据，例如可以在函数中一次返回多个值。

```swift
let http404Error = (404, "Not Found") // http404Error 的类型是 (Int, String)

print("\(http404Error.0), \(http404Error.1).") // 用下标访问元组
```

定义元组时给单个元素命名，然后通过名字来获取元素的值

```swift
let http200Status = (statusCode: 200, description: "OK")

print("\(http200Status.statusCode), \(http200Status.description).")
```

将元组的内容分解为常量

```swift
let (statusCode, statusMessage) = http404Error

print("\(statusCode), \(statusMessage).")
```

元组支持嵌套

```swift
let userInfo = ("lijingcheng", ("male", "Mtime"), ["obj1", "obj2"], ["key": "value"])
```

不使用额外空间就能交换两个值

```swift
func swap(a: inout T, b: inout T) {
    (a, b) = (b, a)
}
```

### Optional
在声明变量时可以用可选类型来处理值可能为 nil 的情况，可选类型也可用于函数参数和函数返回值。（Swift 中 nil 不是指针，它是一个确定的值，可用来表示任何类型变量的值缺失）

```swift
let possibleNumber: String? = "123" // String? 也可以写成 Optional<String>

// 使用可选绑定来判断可选类型是否为空
if let num = possibleNumber {
    print(num)
    print(possibleNumber!) // 强制解析可选类型 possibleNumber，如果值为 nil 则会报错
}
``` 

当确定可选类型变量有值的情况下，可以用隐式解析可选类型来定义这个变量来避免每次使用前的 if 判断，以提高效率。

```swift
let assumedString: String! = "An implicitly unwrapped optional string."

print(assumedString) // 不需要强制解析
```

### Any
Any 相当于 Objective-C 中的 id，它可以表示任何类型，包括函数类型，AnyObject 可以表示任何类类型的实例。可以用类型检查操作符 is 来检查一个实例是否属于特定类型，就像 Objective-C 中的 isKindOf 方法。

```swift
var things: [Any] = [42, "hello", { (name: String) -> String in "Hello, \(name)" }]

for item in things {
    // 用 as? 进行类型转换，如果用 as! 来强制转换，当转换失败时会在运行时报错
    if let intValue = item as? Int {
        print("intValue: \(intValue)")
    }
}

// 因为可选值有可能为 nil，所在再往数组里放时会有警告，避免出现警告可用下面两种方式
let optionalNumber: Int? = 3
things.append(optionalNumber ?? 0)
things.append(optionalNumber as Any) // Int to Any
```

## 运算符
Swift 支持大部分标准 C 语言的运算符，并改进许多特性来减少常规编码错误。

### 赋值运算符
Swift 的赋值操作不返回任何值，所以无法把 == 错写成 =，下面代码会在编译时报错

```swift
if x = y {}
```

### 算术运算符
没有自增和自减运算符，加法运算符可用于字符串拼接

```swift
var str = "hello, " + "world"
```

### 比较运算符
字符、字符串、元组等值类型值可以用 `<` `>` `==` 和 `!=` 来进行比较

```swift
if "apple" == "pen" {}
```

### 三目运算符
不支持下面这种写法

```swift
var i = num != nil ? : 3
```

### 空合运算符

```swift
var colorName: String?

print(colorName ?? "red") // red
```

### 区间运算符

```swift
for index in 1...5 {} // 闭区间运算符
```

```swift
let names = ["Anna", "Alex", "Brian", "Jack"]
let count = names.count

for i in 0..<count {} // 半开区间运算符
```

### 恒等运算符
Swift 提供了恒等 `===` 和不恒等 `!==` 两个比较符来判断类的两个对象是否引用同一个实例，而 `==` 则是用来比较两个实例的值是否相同。

```swift
if tenEighty === alsoTenEighty {}
```

### 溢出运算符
Swift 会在数值溢出时报错，也可以通过溢出运算符在数值溢出的时候采取截断处理。

```swift
var upOverflow = UInt8.max &+ 1 // 上溢运算 0
var downOverflow = UInt8.min &- 1 // 下溢运算 255
```

## 控制流
### if-else
条件语句中的小括号可以省略，并加强了类型安全检查，不能够再用整型参与 Bool 判断

```swift
if 1 {}
```

### guard
当 guard 语句为真时执行 guard 语句下面的代码，使用 guard 做基本的安全检查能有效减少函数中的嵌套数量，并提高代码可读性。

```swift
func hello(name: String?) {
    guard name != nil else {
        return
    }
    
    print("Hello \(name!)")
}
```

### switch
Swift 中的 switch 语句在进行数值匹配时除了支持整型和字符，还支持浮点数、字符串、元组、枚举等类型，并且 case 语句不能有遗漏，如果不愿写太多 case 可用 default 分支满足需求。当匹配的 case 分支中的代码执行完毕后，程序会终止 switch 语句，避免了因忘记写 break 而产生的错误，break 语句可以用于逻辑性的跳出 switch。如果希望能够在执行完 case 中的代码后向下掉落则需要使用 fallthrough。

```swift
let str = "e"

switch str {
case "a":
    break
case "b", "B":
    print("b or B")
case "c"..."e":
    print("c - e")
    fallthrough
default:
    print("default...")
}
```

用 switch 语句匹配元组的值

```swift
let somePoint = (3, 3)

switch somePoint {
case (0, 0):
    print("(0, 0)")
case (_, 0): // 只匹配 y，x 可以是任何值
    print("(\(somePoint.0), 0)")
case (-2...2, -2...2):
    print("(\(somePoint.0), \(somePoint.1))")
case (0, let y): // 只匹配 x，并且将 y 的值赋给常量 y
    print("0, \(y)")
case let (x, y) where x == y: // 通过 where 来进行匹配
    print("\(x) == \(y)")
case let (x, y):
    print("(\(x), \(y))")
}
```

### for-in
如果不需要区间序列内每一项的值，可以使用下划线 _ 替代变量名来忽略这个值

```swift
var array = ["apple", "pen", "apple-pen"]

for _ in array {}
```

### while
while 条件语句中的小括号可以省略，do-while 变成 repeat-while

```swift
repeat {} while i > 0
```

## 函数与闭包
### 函数
Swift 是类型安全的，所以支持参数个数相同但类型不同的函数重载

```swift
func hello(name: String) -> String {
    return "Hello, " + name + "!"
}

func hello(name: Int) -> String {
    return "Hello, " + String(name) + "!"
}

hello(name: "Lee")
hello(name: 3)
```

没有返回值的函数其实是返回了一个特殊的 Void 值，它是一个空的元组，可用()表示

```swift
func greet() {}
func greet() -> () {}
func greet() -> Void {}
```

参数名称默认作为参数标签来使用，我们可以自定义参数标签，也可以用 _ 来忽略参数标签，Swift 支持为参数指定默认值，为了代码可读性考虑，一般将带默认值的参数放在参数列表的最后面

```swift
func say(_ prefixStr: String, parameterLabel parameterName: String = "lijingcheng") -> String {
    return prefixStr + parameterName + "!"
}

say("hello, ", parameterLabel: "lijingcheng")
say("hello, ")
```

一个函数最多只能拥有一个可变参数，可变参数可以接受零个或多个值

```swift
func total(_ numbers: Double...) -> Double {
    var total: Double = 0
    for number in numbers {
        total += number
    }
    return total
}

total(1, 2, 3, 4, 5)
```

函数参数默认是常量，如果要修改参数的值，可以将参数定义为输入输出参数。输入输出参数不能有默认值，而且可变参数不能用 inout 标记。

```swift
func swapTwoInts(_ a: inout Int, _ b: inout Int) {
    let temporaryA = a
    a = b
    b = temporaryA
}

var someInt = 3
var anotherInt = 107
swapTwoInts(&someInt, &anotherInt) // & 对于值类型来说 inout 相当于在函数内部创建了一个新值，然后在函数返回时将这个值赋给 & 修饰的变量，这与引用类型是不一样的。
print("someInt is now \(someInt), and anotherInt is now \(anotherInt)")
``` 

Swift 支持我们用函数式思维来写代码，函数也作为语言的一等公民，函数其实也是一种值，Swift 支持函数类型的变量或常量，可以将函数以参数的形式传给其它函数，并且可以将一个函数作为返回值使用，还支持嵌套函数，通常称这种函数为高阶函数。

```swift
func addTwoInts(a: Int, b: Int) -> Int {
    return a + b
}

var addMathFunction = addTwoInts // 类型为：(Int, Int) -> Int

print(addMathFunction(2, 3)) // print: 5


func printMathResult(_ mathFunction: (Int, Int) -> Int, _ a: Int, _ b: Int) {
    print(mathFunction(a, b))
}

printMathResult(addMathFunction, 3, 5) // print: 8
```

函数的柯里化(Currying)是指把接受多个参数的方法变换成接受第一个参数的方法，并且返回接受余下的参数并且返回结果的新方法。

```swift
func addTo(_ adder: Int) -> (Int) -> Int {
	return { num in
		return num + adder
	}
}

let addTwo = addTo(2) // 变量接收的函数会将 2 作为递增数
let result = addTwo(6) // 调用函数，将 6 与预先设置的 2 相加
```

把函数定义在别的函数体中称作嵌套函数，下面例子中 incrementBySeven 和 incrementByTen 都是常量，但是他们指向的函数仍然可以增加其捕获的变量的值。这是因为函数和闭包都是引用类型。

```swift
func makeIncrementer(forIncrement amount: Int) -> () -> Int {
    var runningTotal = 0
    func incrementer() -> Int {
        runningTotal += amount
        return runningTotal
    }
    return incrementer // 返回内部函数
}

let incrementByTen = makeIncrementer(forIncrement: 10) // incrementByTen 为函数类型变量，并且无参，返回 Int
incrementByTen() // return 10
incrementByTen() // return 20

//如果你创建了另一个 incrementer，它会有属于自己的引用，指向一个全新、独立的 runningTotal 变量：incrementBySeven 和 incrementByTen 没有任何联系

let incrementBySeven = makeIncrementer(forIncrement: 7)
incrementBySeven() // return 7
incrementBySeven() // return 14

incrementByTen() // return 30
``` 

### 闭包
闭包是自包含的函数代码块，可以在代码中被传递和使用，闭包可以捕获和存储其所在上下文中任意常量和变量的引用，即使定义这些常量和变量的原作用域已经不存在，闭包仍然可以在闭包函数体内引用和修改这些值。

全局函数和嵌套函数实际上也是特殊的闭包，全局函数是一个有名字但不会捕获任何值的闭包，嵌套函数是一个有名字并可以捕获其封闭函数域内值的闭包。闭包表达式是一个利用轻量级语法所写的可以捕获其上下文中变量或常量值的匿名闭包

```swift
let names = ["Chris", "Alex", "Ewa", "Barry", "Daniella"]

names.sorted(by: { (s1: String, s2: String) -> Bool in
    return s1 < s2
})
```

Swift 可以根据闭包接收的参数和返回值推断出参数和返回值的类型，所以可以简写为下面形式，很短的函数体可以写成一行，单行表达式闭包可以省略 return，不过完整形式的闭包具有更好的代码可读性。

```swift
names.sorted(by: { s1, s2 in s1 < s2 })
```

闭包的参数列表也可以省略，可以用 $0，$1，$2 来顺序调用闭包的参数

```swift
names.sorted(by: {$0 < $1})
``` 

Swift 的 String 重载了 > 用于比较两个字符串并返回大小，所以 sorted 函数还可以直接将 < 当作闭包处理

```swift
names.sorted(by: <)
```

如果闭包表达式是函数的唯一参数，则可以作为尾随闭包来使用，以增强函数的可读性。

```swift
names.sorted {
    (s1, s2) -> Bool in
    return s1 < s2
}
``` 

当定义接受闭包作为参数的函数时，可以用 @escaping 来标注参数名称，用来指明这个闭包是允许“逃逸”出这个函数的，这样我们就可以用一个变量或常量来接收闭包，并在适当的时候调用它，如果将一个闭包标记为 @escaping 意味着你必须在闭包中显式地引用 self。

```swift
var closures = {}

func someFunctionWithEscapingClosure(completionHandler: @escaping () -> Void) {
    closures = completionHandler
}

var customersInLine = ["Chris", "Alex", "Ewa", "Barry", "Daniella"]

someFunctionWithEscapingClosure { customersInLine.remove(at: 0) }

print(customersInLine.count) // print: 5
closures() // 执行闭包
print(customersInLine.count) // print: 4
``` 

## 枚举
Swift 的枚举成员在被创建时不会被赋予一个默认的整型值，枚举成员本身就是完备的值，多个成员值可以用逗号分隔并定义在一行上

```swift
enum CompassPoint {
    case north, south, east, west
}

var directionToHead = CompassPoint.west
directionToHead = .east // 当 directionToHead 的类型已知时，再次为其赋值可以省略枚举类型名
``` 

枚举成员虽然没有默认值，但是可以给它指定原始值，类型可以是字符串、字符、整型、浮点数，这些原始值一旦设置了就不能再改变，并且值在枚举声明中必须是唯一的而且类型必须相同，使用枚举成员的 rawValue 属性可以访问该成员的原始值。在使用原始值为整数或者字符串类型的枚举时，通常不需要显式地为每一个枚举成员设置原始值，Swift 会自动赋值。

```swift
enum CompassPoint2: String {
    case north, south, east, west
}

let sunsetDirection2 = CompassPoint2.west.rawValue // “west”
``` 

当使用整数作为原始值时，隐式赋值的值依次递增1。如果第一个枚举成员没有设置原始值，其原始值将为0。

```swift
enum CompassPoint3: Int {
    case north = 1, south, east, west
}

let earthsOrder = CompassPoint3.east.rawValue // 3

// 如果在定义枚举类型的时候使用了原始值，那么将会自动获得一个初始化方法，这个方法接收一个叫做 rawValue 的参数，参数类型即为原始值类型，返回值则是枚举成员或 nil。
let possiblePlanet = CompassPoint3(rawValue: 2) // south
let possiblePlanet2 = CompassPoint3(rawValue: 6) // nil
``` 

如果不为枚举成员指定原始值，那么就可以指定任意类型的关联值存储到枚举成员中，每个枚举成员都可以有不同类型的关联值，并且关联值可以修改。

```swift
enum Barcode {
    case upc(Int, Int, Int, Int)
    case qrCode(String)
}

var productBarcode = Barcode.upc(8, 85909, 51226, 3) // .upc关联的元组值为(8, 85909, 51226, 3)。
productBarcode = .qrCode("ABCDEFGHIJKLMNOP")

//关联值可以被提取出来作为 switch 语句的一部分。你可以在switch的 case 分支代码中提取每个关联值作为一个常量（用let前缀）或者作为一个变量（用var前缀）来使用：
switch productBarcode {
case .upc(let numberSystem, let manufacturer, let product, let check):
    print("UPC: \(numberSystem), \(manufacturer), \(product), \(check).")
case .qrCode(let productCode):
    print("QR code: \(productCode).")
}

//如果一个枚举成员的所有关联值都被提取为常量，或者都被提取为变量，为了简洁，你可以只在成员名称前标注一个let或者var：
switch productBarcode {
case let .upc(numberSystem, manufacturer, product, check):
    print("UPC: \(numberSystem), \(manufacturer), \(product), \(check).")
case let .qrCode(productCode):
    print("QR code: \(productCode).")
}
``` 

## 类和结构体
Swift 中的所有的基本类型和枚举都是值类型，它们在底层都是以结构体的形式所实现，所以结构体是值类型，类是引用类型。值类型数据在进行函数传递时会被拷贝，引用类型不会。当定义数据结构的目的是用来封装简单的数据值，并且希望该数据结构在被赋值或传递时，封装的数据及其内部存储的属性也能够通过值传递，那么适合用结构体来定义它。

Swift 中类和结构体都支持属性、方法、下标、构造器、扩展和协议，与结构体相比，类还支持继承、多态、用析构器释放所分配资源以及用引用计数对一个类进行多次引用。另外引用类型对象存储在堆上，值类型在栈上，栈的操作仅仅是指针的上下移动，而堆的操作会因内存的分配和回收产生合并、移位、重新链接等行为，所以使用结构体效率会高一些。另外值类型在复制时，复制的对象和原对象实际上在内存中指向同一个对象。只有当复制后的对象被修改时才会在内存中重新创建一个新的对象，通过 copy-on-write 这种的方式提高效率。

```swift
struct Range {
    // Objective-C 和 Swift 中的属性定义其实都是 setter/getter 方法的声明，其背后还对应一个实例变量，但是在 Swift 中不能直接访问。在 Swift 中属性默认为 nonatomic 和 strong，可改用 weak var ...
    var location: Int
    var length: Int
    
    // 函数与某个类型相关联后通常称为方法，结构体和枚举是值类型。默认情况下，值类型的属性不能在它的实例方法中被修改。但是可以为这个方法选择可变(mutating)行为，然后就可以从其方法内部改变它的属性，甚至修改 self （引用类型可以直接修改）
    mutating func moveBy(_ step: Int) {
        location += step // 通常只有当属性和参数名称一样时才用 self. 方式进行赋值
    }
}

var range = Range(location: 0, length: 3) // 所有结构体都有一个自动生成的成员逐一构造器，用于初始化新结构体实例中成员的属性，类实例没有。因为结构体属于值类型。当值类型的实例被声明为常量的时候，它的所有属性也就成了常量，并且 mutating 方法也不可以被调用。
range.location = 1 // Swift 允许直接设置结构体属性的子属性，Objective-C 不可以（例:self.frame.size.width = 10）
print(range.location)

range.moveBy(1)
print(range.location)
```

存储属性可存储常量或变量作为实例的一部分，只能用于类和结构体。计算属性提供一个 getter 和一个可选的 setter，来间接获取和设置其他属性或变量的值，计算属性可以用于类、结构体和枚举。

可以通过重写属性的方式为继承的属性添加属性观察器，但不包括常量存储型属性和只读计算型属性。父类的属性在子类的构造器中被赋值时，父类会先响应。

```swift
struct Point {
    var x = 0.0 { // 直接赋值或通过构造器赋值时不会触发 KVO，弱引用对象变成 nil 时也不会触发 KVO，并且不能对延迟存储做 KVO
        willSet {
            print(newValue)
        }
        didSet {
            print(oldValue)
        }
    }
    var y = 0.0
}
struct Size {
    var width = 0.0, height = 0.0
}
struct Rect {
    var origin = Point()
    var size = Size()
    var center: Point { // 必须用 var 定义，因为值不是固定的
        get {
            let centerX = origin.x + (size.width / 2)
            let centerY = origin.y + (size.height / 2)
            return Point(x: centerX, y: centerY)
        }
        set(newCenter) { // 如果计算属性的 setter 没有定义表示新值的参数名，则可以使用默认名称 newValue
            origin.x = newCenter.x - (size.width / 2)
            origin.y = newCenter.y - (size.height / 2)
        }
    }
    // 只读计算属性，只有 get，并且可以去掉 get 关键字
    var width: Double {
        return size.width
    }
}
var frame = Rect(origin: Point(x: 2, y: 2), size: Size(width: 10, height: 10))
frame.center = Point(x: 1, y: 3)
```

在 Objective-C 中，与类关联的静态常量或静态变量是全局的，但在 Swift 中，它的作用范围就在类型支持的范围内。

下标可以定义在类、结构体和枚举中，是访问集合，列表或序列中元素的快捷方式。一个类型可以定义多个下标，并通过不同索引类型进行重载。下标不限于一维，可以定义具有多个入参的下标满足自定义类型的需求。

```swift
struct Tyre {
    let row: Int, column: Int
}

class Car {
    var tyre = [Tyre(row: 0, column: 0), Tyre(row: 0, column: 1), Tyre(row: 1, column: 0), Tyre(row: 1, column: 1)]
    
    lazy var allComponentNames = Car.getAllComponentName() // 必须将延迟存储属性声明成变量，因为属性的初始值可能在实例构造完成之后才会得到，全局的常量或变量都是延迟计算的。
    
    static var description = "Car" // 类属性无法被子类重写，class 修饰的属性可以被子类重写，但是只能用来修饰计算属性。
    static func getAllComponentName() -> [String] { return [] } // static 换成 class 则子类可以重写该方法
    
    subscript(row: Int, column: Int) -> Tyre { // car[0, 1]
        get {
            return tyre[(row * column) + column]
        }
        set {
            tyre[(row * column) + column] = newValue
        }
    }
}

let car = Car()
print(car.tyre[1])

car.tyre[1] = Tyre(row: 100, column: 100)
print(car.tyre[1])
```

类和结构体在创建实例时，必须为所有存储型属性设置合适的初始值。如果结构体或类的所有属性都有默认值，同时没有自定义的构造器，那么 Swift 会提供一个默认构造器。与 Objective-C 中的构造器不同，Swift 的构造器无需返回值。

```swift
class User {
    var name: String?
    var age = 10
}
var item = User()
``` 

可以将继承来的只读属性通过提供 getter/setter 重写为一个读写属性，但是不可以将继承来的读写属性重写为一个只读属性。

如果为值类型定义了构造器，将无法访问到他的默认构造器。这种限制可以防止你为值类型增加了一个额外的且十分复杂的构造器之后，仍然有人错误的使用自动生成的构造器，如果希望他们能同时使用，可以将自定义的构造器写到扩展中。

```swift
// Swift 中的类没有通用基类
class Person {
    var name: String
    var age: Int = 0
    var gender = "male" // 尽量为属性设置默认值，不仅代码可读性好，还可以在属性很多时减少构造器参数的个数
    
    init(name: String) { self.name = name }
    
    func sayHello() { print("person: hello!") }
    
    deinit { // 析构器只适用于类类型，用法与 ARC 下的 dealloc() 一样 }
    }
}

// 用 final 修饰的类不能被继承，用 final 修饰方法、属性、下标，则它们不能被重写。
final class Employee: Person {
    var company: String
    var position: String
    
    // 重写父类的指定构造器
    override init(name: String) {
        self.company = ""
        self.position = ""
        
        super.init(name: name)
    }
    
    // 指定构造器将初始化类中提供的所有属性，并必须调用其直接父类的的指定构造器来实现父类的初始化。每一个类都必须拥有至少一个指定构造器。
    init(company: String, position: String) {
        self.company = company
        self.position = position
        
        super.init(name: "")
    }
    
    // 当参数很多时可用便利构造器辅助指定构造器初始化对象，它必须调用同类中的其它构造器，并必须最终导致一个指定构造器被调用
    convenience init(company: String) {
        self.init(company: company, position: "")
    }
    
    // 缺少 override 的重写会在编译时报错，这样可以避免意外重写。
    override func sayHello() {
        super.sayHello()
        
        print("employee: hello!")
    }
}
var item2 = Employee(name: "xx")
``` 

可以用非可失败构造器重写可失败构造器，但反过来不行。

```swift
struct Animal {
    let species: String
    
    // init? 表示可能会构造失败返回 nil
    init?(species: String) {
        if species.isEmpty {
            return nil // 通常构造函数不用 return，唯一用到的情景就是表示构造失败
        }
        self.species = species
    }
}

let someCreature = Animal(species: "Giraffe") // someCreature 的类型是 Animal? 而不是 Animal

if let giraffe = someCreature {
    print("An animal was initialized with a species of \(giraffe.species)")
}
``` 

在类的构造器前添加 required 修饰符表明所有该类的子类都必须实现该构造器

```swift
class SomeClass5 {
    required init() {}
}

class SomeSubclass: SomeClass5 {
    required init() {} // 必须也用 required 应用于继承链后面的子类
}
``` 

### 访问控制
Swift 中的访问控制模型基于模块和源文件这两个概念，并为代码中的实体提供了五种不同的访问级别。

- open：可以被任何模块访问、继承和重写。

- public：可以被任何模块访问，但只能被所定义模块中的类继承和重写。

- internal(默认)：只能被所定义的模块内部访问。

- fileprivate：只能被所定义的文件内部访问。

- private：只能在所定义的作用域内使用。

类的访问级别会影响到类成员的默认访问级别，不可以在某个实体中定义访问级别更低的东西。

```swift
public var xx: SomePrivateClass? // xx 虽然可以被外界访问，但类是私有的，所以没意义
```

```swift
private(set) var name: String? // name 只能被内部修改，但可以被外部访问
```

如果想要在测试 target 中访问模块中所有内部级别的实体，可以在导入模块前使用 @testable，然后修改模块的编译设置项 Build Options -> Enable Testability。

### 元类型
元类型是指类型的类型，类、结构体或枚举类型的元类型是相应的类型名后紧跟 `.Type`，协议的元类型是该协议名字紧跟 `.Protocol`。

```swift
class AnotherSubClass {
    let str: String
    required init(str: String) {
        self.str = str
    }
}

let metatype: AnotherSubClass.Type = AnotherSubClass.self
let anotherInstance = metatype.init(str: "some string") // 用元类型来 init 实例，init 必须是 required 或类是 final 的。

print(type(of: anotherInstance)) // type(of:) 表达式来获取该实例在运行阶段的类型
```

### 嵌套类型

```swift
struct BlackjackCard {
    enum Suit {
        case Spades = "♠", Hearts = "♡", Diamonds = "♢", Clubs = "♣"
    }
}
print(BlackjackCard.Suit.Hearts.rawValue)
```

### 运算符重载
类和结构体可以为现有的运算符提供自定义的实现，这通常被称为运算符重载。只有组合赋值运算符可以被重载，不能对默认的赋值运算符 `=` 和三目条件运算符 `? :` 进行重载。

```swift
struct Vector2D {
    var x = 0.0, y = 0.0
    
    // 中缀运算符
    static func + (left: Vector2D, right: Vector2D) -> Vector2D {
        return Vector2D(x: left.x + right.x, y: left.y + right.y)
    }
    
    // 重载前缀或后缀运算符时需要在 func 前指定 prefix 或 postfix 修饰符
    static prefix func - (vector: Vector2D) -> Vector2D {
        return Vector2D(x: -vector.x, y: -vector.y)
    }
}

let combinedVector = Vector2D(x: 3.0, y: 1.0) + Vector2D(x: 2.0, y: 4.0)
let negativeVector = -Vector2D(x: 2.0, y: 4.0)
```

## 内存管理
Swift 使用 ARC 机制来跟踪和管理内存，并且只针对拥有引用计数的类实例，在 ARC 中有 strong、weak、unnowned 三个关键字，默认为 strong。Swift 可以通过弱引用和无主引用来解决循环引用问题，它们都允许循环引用中的一个实例强引用而另外一个实例不保持强引用。

当可能造成循环引用的两个实例中的其中一个为可选类型，那么就将这个可能为 nil 的属性声明为弱引用

```swift
weak var delegate: XXX?
``` 

当可能造成循环引用的两个实例有着几乎相同的生命周期，并且都不希望值为 nil 时，将有着强制依赖性的那个实例对另一个实例持有无主引用。ARC 无法在实例被销毁后将无主引用设为 nil，所以要小心无主引用实例释放后再次使用它时出现的运行时错误。

```swift
unowned let timer: Timer
```

Swift 提供了闭包捕获列表来解决闭包引起的循环引用。捕获列表定义了闭包体内捕获一个或者多个引用类型的规则，跟解决两个类实例间的循环引用一样。

``` objc
__weak typeof(self) weakSelf = self;

self.block = ^{
    __strong typeof(self) strongSelf = weakSelf;
    [strongSelf doSomething];
};
```

```swift
self.closure = { [weak self] in // 用 weak 而不是 unowned 会更安全些
    guard let strongSelf = self else { return } // 像 OC 一样
    strongSelf.doSomething() // 必须用 self 引用属性或方法
}
```

## 扩展
Swift 的扩展没有名字，可以为已有的类、结构体、枚举和协议添加方法、下标、嵌套类型、计算型属性以及确认某个协议，还可以为类添加新的便利构造器，但是不能为类添加新的指定构造器或析构器，也不可以为已有属性添加属性观察器和重写已有功能。如果要添加存储型属性也要像 Objective-C 中的方式去添加。（http://stackoverflow.com/questions/25426780/how-to-have-stored-properties-in-swift-the-same-way-i-had-on-objective-c）

```swift
extension Int {
    mutating func square() {
        self = self * self
    }
}
```

## 协议
类、结构体或枚举都可以遵循协议，协议里的东西都是 requied 的，但是可以通过协议扩展来提供默认实现，默认实现可以被遵循协议的类型提供的实现所替代。在扩展协议的时候，还可以指定一些限制条件，只有遵循协议的类型满足这些限制条件时，才能获得协议扩展提供的默认实现。

```swift
protocol Named {
    var name: String { get set }
}

protocol Aged {
    var age: Int { get }
}

class TestClass {}

extension Aged where Self: TestClass {
    var age: Int { return 1 }
}

// 父类名放在协议名之前
class Person: TestClass, Named, Aged {
    var name: String
    
    init(name: String) {
        self.name = name
    }
}

// celebrator 的类型为 Named & Aged，这意味着它不关心参数的具体类型，只要参数符合这两个协议即可，这称为协议合成。
func wishHappyBirthday(to celebrator: Named & Aged) {
    print("Happy birthday, \(celebrator.name), you're \(celebrator.age)!")
}

let birthdayPerson = Person(name: "xx")
wishHappyBirthday(to: birthdayPerson)
``` 

添加 class 关键字来限制协议只能被类类型遵循

```swift
protocol SomeProtocol: class {}
``` 

使用 @objc 修饰后的类型，可以供 Objective-C 调用,标记 @objc 特性的协议只能被继承自 Objective-C 类的类或者 @objc 类遵循，struct 不能用，以下代码是错的：

```swift
@objc class test {
    // 使用@objc修饰的类，必须继承自NSObject
}
```

Swift 协议中的所有方法默认情况下都要被确认者实现，可通过扩展来实现某个方法使其成为可选方法，也可用下面方式来实现

```swift
@objc protocol AnotherProtocol {
    @objc optional func incrementForCount(count: Int) -> Int
    @objc optional var fixedIncrement: Int { get }
}
``` 

在 struct 或 enum 中用 mutating 来修饰方法是为了能够在该方法内修改自己的变量，如果协议中定义的方法没有写 mutating，那么确认该协议的 struct 或 enum 就不能在该方法中修改自己的变量，class 的话没关系，因为 class 可以随意修改自己的变量。

```swift
protocol SomeProtocol {
    var name: String { get set }

    mutating func changeName(_ name: String)
}

struct SomeClass: SomeProtocol {
    mutating func changeName(_ name: String) {
        self.name = name // changeName 方法如果没加 mutating 编译会报错
    }
}

``` 

## 泛型
泛型能够减少重复代码，用一种清晰和抽象的方式来表达代码的意图。

```swift
// 没用到泛型，它只能交换 Int 值
func swapTwoInts(_ a: inout Int, _ b: inout Int) {
    let temporaryA = a
    a = b
    b = temporaryA
}

// 用了泛型可以交换任意类型的值，T 的具体类型可以由传入的值的类型推断出来。
func swapTwoValues<T>(_ a: inout T, _ b: inout T) {
    let temporaryA = a
    a = b
    b = temporaryA
}
``` 

泛型还可以添加类型约束，用来指定一个类型参数必须继承自指定类，或者符合一个特定的协议或协议组合。

```swift
func findIndex<T: Equatable>(of valueToFind: T, in array:[T]) -> Int? {
    for (index, value) in array.enumerated() {
        if value == valueToFind {
            return index
        }
    }
    return nil
}

let doubleIndex = findIndex(of: 9.3, in: [3.14159, 0.1, 0.25])
let stringIndex = findIndex(of: "Andrea", in: ["Mike", "Malcolm", "Andrea"])
```

Swift 还允许定义泛型类型。

```swift
struct Stack<Element> {
    var items = [Element]()
    mutating func push(_ item: Element) {
        items.append(item)
    }
    mutating func pop() -> Element {
        return items.removeLast()
    }
}

var stackOfStrings = Stack<String>()
stackOfStrings.push("apple")
```

## 错误处理
和其他语言中的异常处理不同的是，Swift 中的错误处理并不涉及展开调用栈，所以对性能影响不大。

```swift
enum StringError: Error {
    case StringisEmpty, OtherError
}

func canThrowAnError(name: String) throws -> String {
    guard !name.isEmpty else {
        throw StringError.StringisEmpty
    }
    
    return "no error"
}

do {
    var str = try canThrowAnError(name: "") // 如果写成 try?，那么方法在抛出错误时，会将 nil 赋给 str，如果认为方法不可能抛出错误，可以用 try!
    
    print("没有错误")
} catch StringError.StringisEmpty where 1 == 1 {
    print("字符串不能为空")
} catch let error {
    print("其它错误: \(error)")
}
```

## 其它
### 给类型起别名

```swift
typealias MyInt = Int
```

### 注释

```swift
/* 
    ...
    /* 支持多行注释嵌套 */
    ...
*/
```

### 断言
一般用于在函数中对参数进行有效性验证，以避免非法的参数值导致函数不能正常执行，Xcode 在用 Release 配置项编译项目时，断言会被禁用。

```swift
let age = -3

assert(age >= 0, "A person's age cannot be less than zero")
```

### 编译配置语句

```swift
#if arch(i386) || arch(x86_64)

#endif
```

```swift
#if swift( >=3.0.0 )
    
#endif
```

```swift
if #available(iOS 9.1.0, *) {
    // 使用 iOS 9.1.0+ 的 API
}
```

```swift
print(#file, #function, #line)
```

### 标注命令

```swift
// MARK: - Section mark with a separator line
// TODO: Do something soon
// FIXME: Fix this code
```

### @discardableResult
如果没有使用方法返回的对象，编译器会有一个警告，有两种方法可以解决。

- 如果是自己写的方法，在 func 前加 @discardableResult 修饰符，代表可以不使用返回值

- 对于第三方库中的方法：_ = navigationController?.popViewController(animated: true)

### defer 语句
defer语句在即将离开当前代码块时（throw、return 等）执行一系列语句，可用于执行一些必要的清理工作。

```swift
func test(_ param: String) {
    guard param.isEmpty else {
        return
    }
    defer {
        print("我一定会被执行")
    }
}

test("")
``` 


