/**
 * @author zhangluo
 * @desc 产品线配置文件, 由于需求一致，只是每条线的参数不同，所以将参数名配置在此处，方便维护
 */

/**
 * @desc 产品线 —— 后端请求接口时需要在请求体中携带此字段以区分产品线
 * @var products 产品线名称
 */
const products = ['logo', 'poster', 'pack_logo_brand_adjust', 'pack_render', 't2i']


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
    { name: 'productRef', maxCount: 1 }, // pack
]

/**
 * @desc 海报产品线
 * @attation poster_ModelArgsToTypeArgs 文本/数字字段参数按工作流结点先后顺序在前，文件/图片名字段参数按结点先后顺序在后
 * @var poster_ModelArgsToTypeArgs model工作流结点 .mets.title => 自定义图片变量名
 * @var poster_ModelArgsToTextVarArgs model工作流结点 .mets.title => 自定义文本变量名
 * @var poster_ImageVarToModelArgs 自定义图片变量名 => model工作流结点 .mets.title
 */
// const poster_ModelArgsToTypeArgs = [
//     { key: 'TitleTextInput', value: 'text' },
//     { key: "ChineseInput", value: 'text' },
//     { key: "EasyKSampler", value: 'seed' },
//     { key: "LogoInput", value: 'image' },
//     { key: "ChanPingInput", value: 'image' },
// ]
const poster_ModelArgsToTypeArgs = [
    { key: "EasyKSampler", value: 'seed' }, // 64
    { key: "ChineseInput", value: 'text' }, // 151
    { key: 'TitleTextInput', value: 'text' }, // 170
    { key: "ChanPingInput", value: 'image' }, // 16
    { key: "LogoInput", value: 'image' }, // 172
]
const poster_ModelArgsToTextVarArgs = [
    { key: "EasyKSampler", value: 'seed' }, // 随机种子，相同参数下，生成不同的图
    { key: "ChineseInput", value: 'posterContent' },// 前端海报内容输入
    { key: 'TitleTextInput', value: 'mainTitle' },// 主标题输入
]
const poster_ImageVarToModelArgs = [
    { key: "mainImg", value: 'ChanPingInput' },// 前端产品主图输入
    { key: 'logo', value: 'LogoInput' },// 传入LOGO图片
]


/**
 * @desc Logo产品线
 * @attation logo_ModelArgsToTypeArgs 文本/数字字段参数按工作流结点先后顺序在前，文件/图片名字段参数按结点先后顺序在后
 * @var logo_ModelArgsToTypeArgs model工作流结点 .mets.title => 自定义图片变量名
 * @var logo_ModelArgsToTextVarArgs model工作流结点 .mets.title => 自定义文本变量名
 * @var logo_ImageVarToModelArgs 自定义图片变量名 => model工作流结点 .mets.title
 */
const logo_ModelArgsToTypeArgs = [
    { key: 'K采样器', value: 'seed' }, // 3
    // { key: 'K采样器', value: 'seed' }, // 14
    { key: 'TextInput', value: 'text' }, // 27
    { key: "TextInput", value: 'from_translate' }, //27
    { key: "IPAdapterAdvanced", value: 'weight' }, // 107
    { key: "LoadExample", value: 'image' }, // 55
]

const logo_ModelArgsToTextVarArgs = [
    { key: 'K采样器', value: 'seed' }, // 3
    { key: 'TextInput', value: 'logoKeys' },// 关键词输入
    { key: "TextInput", value: 'language' },// 翻译语言
    { key: "IPAdapterAdvanced", value: 'weight' }// logo参考图权重
]
const logo_ImageVarToModelArgs = [
    { key: 'logoReference', value: 'LoadExample' }// logo参考图输入
]


/**
 * @desc pack_logo_brand_adjust - AI包装-logo与品牌名称调整 - 产品线
 * @attation pack_logo_brand_adjust_ModelArgsToTypeArgs 文本/数字字段参数按工作流结点先后顺序在前，文件/图片名字段参数按结点先后顺序在后
 * @var pack_logo_brand_adjust_ModelArgsToTypeArgs model工作流结点 .mets.title => 自定义图片变量名
 * @var pack_logo_brand_adjust_ModelArgsToTextVarArgs model工作流结点 .mets.title => 自定义文本变量名
 * @var pack_logo_brand_adjust_ImageVarToModelArgs 自定义图片变量名 => model工作流结点 .mets.title
 */
const pack_logo_brand_adjust_ModelArgsToTypeArgs = [
    { key: "text transform scale", value: 'x_percent' }, // text调整位置x
    { key: "text transform scale", value: 'y_percent' }, // text调整位置y
    { key: "logo transform scale", value: 'x_percent' }, // logo调整位置x
    { key: "logo transform scale", value: 'y_percent' }, // logo调整位置y
    { key: "logo transform scale", value: 'scale' }, // logo调整大小
    { key: "Brand name", value: 'text' }, // 生成图像中的文本内容
    { key: "Brand name", value: 'font_file' }, // 用于生成图像的字体文件
    { key: "Brand name", value: 'spacing' }, // -500 文本布局的其他细节，如字间距、行间距、边界、缩放、颜色等
    { key: "Brand name", value: 'scale' }, // 字体大小
    { key: "Product Image", value: 'image' }, // 载入包装图片文件名
    { key: "logo Image", value: 'image' }, // 载入logo图片文件名
]

const pack_logo_brand_adjust_ModelArgsToTextVarArgs = [
    { key: "text transform scale", value: 'text_x_percent' }, // text调整位置x
    { key: "text transform scale", value: 'text_y_percent' }, // text调整位置x
    { key: "logo transform scale", value: 'logo_x_percent' }, // logo调整位置x
    { key: "logo transform scale", value: 'logo_y_percent' }, // logo调整位置y
    { key: "logo transform scale", value: 'logo_scale' }, // logo调整大小
    { key: "Brand name", value: 'text' }, // 生成图像中的文本内容
    { key: "Brand name", value: 'font_file' }, // 用于生成图像的字体文件
    { key: "Brand name", value: 'spacing' }, // -500 文本布局的其他细节，如字间距、行间距、边界、缩放、颜色等
    { key: "Brand name", value: 'brand_scale' }, // 品牌名称字体大小
]
const pack_logo_brand_adjust_ImageVarToModelArgs = [
    { key: "packageRef", value: 'Product Image' }, // 包装参考图
    { key: "logoRef", value: 'logo Image' }, // Logo参考图
]

/**
 * @desc pack_render - AI包装-渲染出图 - 产品线
 * @attation pack_render_ModelArgsToTypeArgs 文本/数字字段参数按工作流结点先后顺序在前，文件/图片名字段参数按结点先后顺序在后
 * @var pack_render_ModelArgsToTypeArgs model工作流结点 .mets.title => 自定义图片变量名
 * @var pack_render_ModelArgsToTextVarArgs model工作流结点 .mets.title => 自定义文本变量名
 * @var pack_render_ImageVarToModelArgs 自定义图片变量名 => model工作流结点 .mets.title
 */
const pack_render_ModelArgsToTypeArgs = [
    { key: "render", value: 'seed' }, // 渲染步数
    { key: "render", value: 'steps' }, // 渲染步数
    { key: "render", value: 'cfg' }, // 渲染深度
    { key: "render", value: 'denoise' }, // 渲染降噪
    { key: "Product description", value: 'text' }, // 产品描述
    { key: "style", value: 'ckpt_name' }, // 风格选择
    { key: "Product Image", value: 'image' }, // 载入产品图文件名
]

const pack_render_ModelArgsToTextVarArgs = [
    { key: "render", value: 'seed' }, // 渲染步数
    { key: "render", value: 'steps' }, // 渲染步数
    { key: "render", value: 'deep' }, // 渲染深度
    { key: "render", value: 'denoise' }, // 渲染降噪
    { key: "Product description", value: 'productDesc' }, // 产品描述
    { key: "style", value: 'style' }, // 风格选择
]
const pack_render_ImageVarToModelArgs = [
    { key: "productRef", value: 'Product Image' }, // 产品参考图
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

    pack_logo_brand_adjust_ModelArgsToTypeArgs,
    pack_logo_brand_adjust_ImageVarToModelArgs,
    pack_logo_brand_adjust_ModelArgsToTextVarArgs,

    pack_render_ModelArgsToTypeArgs,
    pack_render_ImageVarToModelArgs,
    pack_render_ModelArgsToTextVarArgs,
}