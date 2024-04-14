/**
 * @author zhangluo
 * @desc 产品线配置文件, 由于需求一致，只是每条线的参数不同，所以将参数名配置在此处，方便维护
 */

/**
 * @desc 产品线 —— 后端请求接口时需要在请求体中携带此字段以区分产品线
 * @var products 产品线名称
 */
const products = ['logo', 'poster', 'pack']


/**
 * @desc 每条产品线对应的图片变量名
 * - multer 中间件获取多/单文件上传并解析
 */
const multerField = [
    { name: 'logo', maxCount: 1 }, //poster
    { name: 'mainImg', maxCount: 1 }, //poster
    { name: 'logoReference', maxCount: 1 }, // Logo
    { name: 'packageRef', maxCount: 1 }, // pack
    { name: 'logoRef', maxCount: 1 }, // pack
]

/**
 * @desc 海报产品线
 * @var poster_ImageVarToModelArgs 自定义图片变量名 => model参数名
 * @var poster_ModelArgsToTextVarArgs model参数名 => 自定义文本变量名
 */
const poster_ModelArgsToTypeArgs = [
    { key: 'TitleTextInput', value: 'text' },
    { key: "ChineseInput", value: 'text' },
    { key: "LogoInput", value: 'image' },
    { key: "ChanPingInput", value: 'image' },
]
const poster_ModelArgsToTextVarArgs = [
    { key: 'TitleTextInput', value: 'mainTitle' },// 主标题输入
    { key: "ChineseInput", value: 'posterContent' },// 前端海报内容输入
]
const poster_ImageVarToModelArgs = [
    { key: 'logo', value: 'LogoInput' },// 传入LOGO图片
    { key: "mainImg", value: 'ChanPingInput' },// 前端产品主图输入
]


/**
 * @desc Logo产品线
 * @var logo_ImageVarToModelArgs 自定义图片变量名 => model参数名
 * @var logo_ModelArgsToTextVarArgs model参数名 => 自定义文本变量名
 */
const logo_ModelArgsToTypeArgs = [
    { key: 'TextInput', value: 'text' },
    { key: "TextInput", value: 'from_translate' },
    { key: "IPAdapterAdvanced", value: 'weight' },
    { key: "LoadExample", value: 'image' },
]

const logo_ModelArgsToTextVarArgs = [
    { key: 'TextInput', value: 'logoKeys' },// 关键词输入
    { key: "TextInput", value: 'language' },// 翻译语言
    { key: "IPAdapterAdvanced", value: 'weight' }// logo参考图权重
]
const logo_ImageVarToModelArgs = [
    { key: 'logoReference', value: 'LoadExample' }// logo参考图输入
]


/**
 * @desc pack产品线
 * @var pack_ImageVarToModelArgs 自定义图片变量名 => model参数名
 * @var pack_ModelArgsToTextVarArgs model参数名 => 自定义文本变量名
 */
const pack_ModelArgsToTypeArgs = [
    { key: 'Product description', value: 'from_translate' }, // 指定翻译起始语言，默认为自动检测
    { key: "Product description", value: 'to_translate' }, // 指定翻译目标语言，默认为英语
    { key: "Product description", value: 'text' }, // 提供给模型的文本内容
    { key: "Brand name", value: 'text' }, // 生成图像中的文本内容
    { key: "Brand name", value: 'font_file' }, // 用于生成图像的字体文件
    { key: "Brand name", value: 'spacing' }, // -500 文本布局的其他细节，如字间距、行间距、边界、缩放、颜色等
    { key: "Load packaging", value: 'image' }, // 指定加载图像的文件名
    { key: "load logo", value: 'image' }, // 指定加载图像的文件名
]

const pack_ModelArgsToTextVarArgs = [
    { key: 'Product description', value: 'from_translate' }, // 指定翻译起始语言，默认为自动检测
    { key: "Product description", value: 'to_translate' }, // 指定翻译目标语言，默认为英语
    { key: "Product description", value: 'packKeys' }, // 提供给模型的文本内容
    { key: "Brand name", value: 'text' }, // 生成图像中的文本内容
    { key: "Brand name", value: 'font_file' }, // 用于生成图像的字体文件，文件字体存于模型服务器
    { key: "Brand name", value: 'spacing' }, // -500 文本布局的其他细节，如字间距、行间距、边界、缩放、颜色等
]
const pack_ImageVarToModelArgs = [
    { key: "packageRef", value: 'Load packaging' }, // 包装参考图
    { key: "logoRef", value: 'load logo' }, // Logo参考图
]


module.exports = {
    multerField,
    products,
    poster_ModelArgsToTypeArgs,
    poster_ImageVarToModelArgs,
    poster_ModelArgsToTextVarArgs,

    logo_ModelArgsToTypeArgs,
    logo_ImageVarToModelArgs,
    logo_ModelArgsToTextVarArgs,

    pack_ModelArgsToTypeArgs,
    pack_ModelArgsToTextVarArgs,
    pack_ImageVarToModelArgs
}