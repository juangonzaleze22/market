export type CatalogCategorySeed = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageSlug: string;
};

export type CatalogTagSeed = {
  name: string;
  slug: string;
  color: string;
};

export type CatalogProductSeed = {
  name: string;
  slug: string;
  description: string;
  price: number;
  costPrice: number;
  stock: number;
  sku: string;
  categorySlug: string;
  imageFile: string;
  tagSlugs: string[];
  hasDiscount: boolean;
  discountPercent: number | null;
  discountPrice: number | null;
};

export type CatalogCollectionSeed = {
  title: string;
  slug: string;
  subtitle: string;
  imageFile: string;
  placements: string[];
  sortOrder: number;
  productSlugs: string[];
};

export const categorySeedList: CatalogCategorySeed[] = [
  {"name":"Despensa","slug":"despensa","description":"Alimentos básicos, enlatados y productos esenciales para tu hogar","icon":"shopping-basket","imageSlug":"harina-maiz-blanco-libre-de-gluten-pan-1-kg"},
  {"name":"Bebidas","slug":"bebidas","description":"Gaseosas, jugos, maltas y bebidas para compartir","icon":"cup-soda","imageSlug":"malta-en-lata-morena-250ml"},
  {"name":"Lácteos y Huevos","slug":"lacteos-huevos","description":"Leche, quesos, margarina, yogurt y huevos frescos","icon":"milk","imageSlug":"leche-completa-esterilizada-uht-san-simon-1l"},
  {"name":"Carnes y Embutidos","slug":"carnes-embutidos","description":"Pollo, carne y embutidos seleccionados","icon":"beef","imageSlug":"alitas-de-pollo-que-pollo-590g-aprox"},
  {"name":"Frutas y Verduras","slug":"frutas-verduras","description":"Frescos del día para tus comidas","icon":"carrot","imageSlug":"papa-amarilla-lavada-1kg-aprox"},
  {"name":"Snacks y Postres","slug":"snacks-postres","description":"Tostones, tortas y antojos para cualquier momento","icon":"cookie","imageSlug":"torta-tiramisu-melegatti-400g"},
  {"name":"Limpieza","slug":"limpieza","description":"Productos de limpieza y cuidado del hogar","icon":"spray-can","imageSlug":"cloro-limon-orquidea-1l"},
];

export const tagSeedList: CatalogTagSeed[] = [
  {"name":"Nuevo","slug":"nuevo","color":"#2563eb"},
  {"name":"Oferta","slug":"oferta","color":"#dc2626"},
  {"name":"Destacado","slug":"destacado","color":"#f59e0b"},
  {"name":"Envío gratis","slug":"envio-gratis","color":"#16a34a"},
  {"name":"Premium","slug":"premium","color":"#7c3aed"},
  {"name":"Edición limitada","slug":"edicion-limitada","color":"#db2777"},
  {"name":"Esencial","slug":"esencial","color":"#0ea5e9"},
];

export const productSeedList: CatalogProductSeed[] = [
  {"name":"Harina Maiz Blanco Libre de Gluten Pan 1 Kg","slug":"harina-maiz-blanco-libre-de-gluten-pan-1-kg","description":"Es un ingrediente versátil y popular en la cocina latinoamericana, especialmente en la preparación de arepas, empanadas y otros platos tradicionales. Practico para su uso ya que solo requiere la adición de agua para formar una masa.","price":1.22,"costPrice":0.93,"stock":150,"sku":"TZM-7591002200145","categorySlug":"despensa","imageFile":"harina-maiz-blanco-libre-de-gluten-pan-1-kg.webp","tagSlugs":["esencial","oferta"],"hasDiscount":true,"discountPercent":10,"discountPrice":1.1},
  {"name":"Aceite de Soya Vatel 800ml","slug":"aceite-de-soya-vatel-800ml","description":"Alto contenidos de omegas, favorece la salud cardiovascular. Gracias a su composición de ácidos grasos esenciales Omega 3 y 6 ayudan a disminuir el colesterol malo LDL y aumentar el colesterol bueno HDL en la sangre. contiene vitamina E. Resiste altas temperaturas.","price":2.85,"costPrice":2.17,"stock":150,"sku":"TZM-7591049002252","categorySlug":"despensa","imageFile":"aceite-de-soya-vatel-800ml.webp","tagSlugs":["oferta","destacado"],"hasDiscount":true,"discountPercent":10,"discountPrice":2.57},
  {"name":"Arroz Blanco Tipo 1 Premium Amanecer 900g","slug":"arroz-blanco-tipo-1-premium-amanecer-900g","description":"Es una selección exclusiva de granos de alta calidad, diseñado para quienes buscan una textura superior y una cocción perfecta. Gracias a su riguroso proceso de limpieza y clasificación, ofrece un grano más entero, suelto y de mayor rendimiento, ideal para elevar el estándar de cualquier receta. Es el complemento...","price":0.97,"costPrice":0.74,"stock":150,"sku":"TZM-7599450000034","categorySlug":"despensa","imageFile":"arroz-blanco-tipo-1-premium-amanecer-900g.webp","tagSlugs":["esencial","destacado"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Azúcar Refinada Montalban 1 Kg","slug":"azucar-refinada-montalban-1-kg","description":"solución de gran utilidad para endulzar tus bebidas, postres y recetas diarias con total confianza. Su principal ventaja es su fórmula de fácil disolución y alta pureza, lo que garantiza un sabor dulce uniforme en todas tus preparaciones.","price":1.66,"costPrice":1.26,"stock":150,"sku":"TZM-7591357020405","categorySlug":"despensa","imageFile":"azucar-refinada-montalban-1-kg.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Café Tostado y Molido Gourmet Amanecer 200g","slug":"cafe-tostado-y-molido-gourmet-amanecer-200g","description":"Integra una cuidadosa selección de granos que sometidos a un tueste medio desarrolla fragancias y aromas intensos con leves notas acarameladas, destacando un perfil de sabores dulces, cereales tostados y un cuerpo medio que genera sensación de plenitud en la infusión. Ofreciendo una experiencia sensorial que despierta...","price":2.55,"costPrice":1.94,"stock":150,"sku":"TZM-7595461000049","categorySlug":"despensa","imageFile":"cafe-tostado-y-molido-gourmet-amanecer-200g.webp","tagSlugs":["destacado"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Atún en Lomos al Agua Los Monjes 160g","slug":"atun-en-lomos-al-agua-los-monjes-160g","description":"Su principal utilidad es brindar una fuente de proteína saludable y lista para consumir, con la ventaja de ser lomos seleccionados que mantienen una textura firme, ideales para ensaladas o pastas.","price":2.36,"costPrice":1.79,"stock":150,"sku":"TZM-0745110855361","categorySlug":"despensa","imageFile":"atun-en-lomos-al-agua-los-monjes-160g.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Malta en Lata Morena 250ml","slug":"malta-en-lata-morena-250ml","description":"Es una bebida deliciosa y refrescante, perfecta para disfrutar en cualquier momento. Su sabor dulce y su textura carbonatada la convierten en una opción popular para personas de todas las edades.","price":0.9,"costPrice":0.68,"stock":98,"sku":"TZM-7592243001423","categorySlug":"bebidas","imageFile":"malta-en-lata-morena-250ml.webp","tagSlugs":["oferta"],"hasDiscount":true,"discountPercent":10,"discountPrice":0.81},
  {"name":"Ponche Crema Eliodoro Gonzalez P 0.70L","slug":"ponche-crema-eliodoro-gonzalez-p-070l","description":"Crema de licor dulce y suave, único en el mercado, elaborado a partir de una mezcla natural de ingredientes de alta calidad, lo que lo hace ideal para acompañar los momentos más especiales de la familia. Más que una bebida se trata de un sabor, de una tradición, de un modo de ser. Disfrute del producto solo, con hielo...","price":14.56,"costPrice":11.07,"stock":150,"sku":"TZM-7591089000034","categorySlug":"bebidas","imageFile":"ponche-crema-eliodoro-gonzalez-p-070l.webp","tagSlugs":["oferta","destacado"],"hasDiscount":true,"discountPercent":15,"discountPrice":12.38},
  {"name":"Coca Cola Sabor Original Menos Calorías 2L","slug":"coca-cola-sabor-original-menos-calorias-2l","description":"Descubre la refrescante experiencia de Coca-Cola Sabor Original Menos Calorías 2L, el equilibrio perfecto entre el sabor inconfundible que amas y un estilo de vida más ligero. Su fórmula única ofrece la misma dulzura y burbujeo icónico pero con un contenido calórico reducido, cuidando tu bienestar sin sacrificios.","price":1.32,"costPrice":1,"stock":150,"sku":"TZM-7591127123626","categorySlug":"bebidas","imageFile":"coca-cola-sabor-original-menos-calorias-2l.webp","tagSlugs":["destacado"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Jugo de Naranja Justy 1.5L","slug":"jugo-de-naranja-justy-15l","description":"Bebida sabor a Naranja.","price":1.05,"costPrice":0.8,"stock":12,"sku":"TZM-7592661000725","categorySlug":"bebidas","imageFile":"jugo-de-naranja-justy-15l.webp","tagSlugs":["nuevo"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Leche Completa Esterilizada UHT San Simon 1L","slug":"leche-completa-esterilizada-uht-san-simon-1l","description":"Ofrece una fuente de calcio y energía lista para consumir en cualquier momento. Su gran ventaja es que viene enriquecida con Vitaminas A y D, lo que beneficia al usuario al fortalecer los huesos y el sistema inmunológico con la cremosidad de la leche pura de vaca.","price":2.78,"costPrice":2.11,"stock":94,"sku":"TZM-7596914000258","categorySlug":"lacteos-huevos","imageFile":"leche-completa-esterilizada-uht-san-simon-1l.webp","tagSlugs":["esencial","destacado"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Huevos Cartón 30 Und","slug":"huevos-carton-30-und","description":"Estos huevos frescos, en un práctico estuche, son un alimento esencial. Ofrecen proteínas de alta calidad y vitaminas esenciales, contribuyendo a una dieta saludable. Su inigualable versatilidad permite prepararlos de infinitas maneras: fritos, revueltos, cocidos o como ingrediente en horneados y platos salados,...","price":5.71,"costPrice":4.34,"stock":150,"sku":"TZM-9046","categorySlug":"lacteos-huevos","imageFile":"huevos-carton-30-und.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Margarina Mavesa 500g","slug":"margarina-mavesa-500g","description":"Margarina elaborada a partir de aceites vegetales, que actúa como un excelente sustituto de la mantequilla y como ingrediente para aderezar tus comidas o realizar postres.","price":3.06,"costPrice":2.33,"stock":150,"sku":"TZM-7590006200137","categorySlug":"lacteos-huevos","imageFile":"margarina-mavesa-500g.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Queso Blanco Llanero para Rallar 500g Aprox","slug":"queso-blanco-especial-para-rallar-500g-aprox","description":"Este queso destaca por su punto de sal equilibrado y su textura firme y seca, diseñada específicamente para lograr ese rallado perfecto que rinde y se mantiene suelto sobre tus preparaciones.","price":4.94,"costPrice":3.75,"stock":150,"sku":"TZM-100000030349","categorySlug":"lacteos-huevos","imageFile":"queso-blanco-especial-para-rallar-500g-aprox.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Yogurt Griego Plain Yolo 680g","slug":"yogurt-griego-plain-yolo-680g","description":"¡Ahora en tamaño familiar! Este yogur destaca por su sabor neutro y textura batida, diseñado para ser el lienzo en blanco ideal para todas tus creaciones culinarias, desde desayunos hasta aderezos. Obtienes la opción perfecta para compartir en casa, aportando 13g de proteína por porción y solo 140 calorías,...","price":8.45,"costPrice":6.42,"stock":26,"sku":"TZM-7598678000093","categorySlug":"lacteos-huevos","imageFile":"yogurt-griego-plain-yolo-680g.webp","tagSlugs":["nuevo","destacado"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Alitas de Pollo Que Pollo 500g aprox","slug":"alitas-de-pollo-que-pollo-590g-aprox","description":"Son la opción perfecta para tus reuniones o cenas familiares, ofreciendo frescura y calidad superior en cada pieza. Su gran versatilidad permite prepararlas fritas, al horno o con tu salsa favorita, brindando una fuente deliciosa de proteína con un sabor irresistible.","price":2.37,"costPrice":1.8,"stock":150,"sku":"TZM-2000000032887","categorySlug":"carnes-embutidos","imageFile":"alitas-de-pollo-que-pollo-590g-aprox.webp","tagSlugs":["oferta","destacado"],"hasDiscount":true,"discountPercent":35,"discountPrice":1.54},
  {"name":"Jamon de Pierna Superior Alinieve 200g","slug":"jamon-de-pierna-superior-alinieve-200g","description":"Se elabora a partir de carne magra del pernil de cerdo, ofreciendo una textura tierna, jugosa y un sabor tradicionalmente suave con un toque de ahumado fino. Es ideal para degustar en rebanadas, sándwiches o tablas de fiambres.","price":2.06,"costPrice":1.57,"stock":62,"sku":"TZM-19001","categorySlug":"carnes-embutidos","imageFile":"jamon-de-pierna-superior-alinieve-200g.webp","tagSlugs":["oferta"],"hasDiscount":true,"discountPercent":10,"discountPrice":1.86},
  {"name":"Carne Molida 85% Libre De Grasa 500gr","slug":"carne-molida-85-porc-libre-de-grasa-500gr","description":"Cortes de excelente calidad, solomo abierto, paleta y lagarto con un 15% aproximado de tendón y cartílago que son los puntos blancos que se pueden apreciar en el producto.","price":4.36,"costPrice":3.31,"stock":150,"sku":"TZM-2000000030623","categorySlug":"carnes-embutidos","imageFile":"carne-molida-85-porc-libre-de-grasa-500gr.webp","tagSlugs":["destacado"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Papa Amarilla Lavada 1Kg Aprox","slug":"papa-amarilla-lavada-1kg-aprox","description":"Es un ingrediente versátil y sabroso que puede elevar cualquier platillo. Se puede usar hervida, asada, frita, al horno, pure, guisos, sopa y mas.","price":2.62,"costPrice":1.99,"stock":150,"sku":"TZM-2001","categorySlug":"frutas-verduras","imageFile":"papa-amarilla-lavada-1kg-aprox.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Tomates Perita 1Kg Aprox","slug":"tomates-perita-1kg-aprox","description":"Es una variedad ideal para diversas preparaciones culinarias, gracias a su sabor dulce y su textura firme. Se puede usar en salsas, ensaladas, guisos, sopas, asados y mas.","price":3.74,"costPrice":2.84,"stock":150,"sku":"TZM-13094","categorySlug":"frutas-verduras","imageFile":"tomates-perita-1kg-aprox.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Cambur Seleccionado Tipo AA 1kg Aprox","slug":"cambur-seleccionado-tipo-aa-1kg-aprox","description":"Fuente de carbohidratos. El aporte energético del plátano se debe a su contenido de carbohidratos. Gran aporte de vitaminas. Fuente de minerales.","price":1.45,"costPrice":1.1,"stock":12,"sku":"TZM-14880","categorySlug":"frutas-verduras","imageFile":"cambur-seleccionado-tipo-aa-1kg-aprox.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Torta Tiramisu Melegatti 400g","slug":"torta-tiramisu-melegatti-400g","description":"Torta tiramisú al horno con levadura natural, rellena de crema mascarpone y sirope de café, decorado de cacao en polvo.","price":17.33,"costPrice":13.17,"stock":12,"sku":"TZM-8002630100343","categorySlug":"snacks-postres","imageFile":"torta-tiramisu-melegatti-400g.webp","tagSlugs":["nuevo","premium"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Tostón de Ajo con Salsa de Tomate Pache 90g a 100g","slug":"toston-de-ajo-con-salsa-de-tomate-pache-90g-a-100g","description":"Crujientes y llenos de sabor, son ideales para meriendas, reuniones o compartir. El toque de ajo aporta un perfil intenso y el sobre incluido añade un complemento práctico que realza cada bocado.","price":1.49,"costPrice":1.13,"stock":32,"sku":"TZM-19037","categorySlug":"snacks-postres","imageFile":"toston-de-ajo-con-salsa-de-tomate-pache-90g-a-100g.webp","tagSlugs":["nuevo"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
  {"name":"Cloro Limon Orquidea 1L","slug":"cloro-limon-orquidea-1l","description":"Ofrece una potente acción desinfectante y blanqueadora, ideal para la higiene profunda del hogar. A diferencia del cloro tradicional, incorpora una refrescante fragancia a limón, que ayuda a neutralizar los olores fuertes mientras desinfecta. Es perfecto para pisos, baños y superficies, dejando un ambiente limpio y...","price":1.14,"costPrice":0.87,"stock":150,"sku":"TZM-7593126000151","categorySlug":"limpieza","imageFile":"cloro-limon-orquidea-1l.webp","tagSlugs":["esencial"],"hasDiscount":false,"discountPercent":null,"discountPrice":null},
];

export const collectionSeedList: CatalogCollectionSeed[] = [
  {
    title: 'Esencial en tu Despensa 🥛',
    slug: 'esencial-en-tu-despensa',
    subtitle: 'Los básicos que no pueden faltar',
    imageFile: 'harina-maiz-blanco-libre-de-gluten-pan-1-kg.webp',
    placements: ['home', 'shop'],
    sortOrder: 0,
    productSlugs: [
      'harina-maiz-blanco-libre-de-gluten-pan-1-kg',
      'arroz-blanco-tipo-1-premium-amanecer-900g',
      'aceite-de-soya-vatel-800ml',
      'azucar-refinada-montalban-1-kg',
      'atun-en-lomos-al-agua-los-monjes-160g',
      'leche-completa-esterilizada-uht-san-simon-1l',
      'huevos-carton-30-und',
      'margarina-mavesa-500g',
      'queso-blanco-especial-para-rallar-500g-aprox',
      'papa-amarilla-lavada-1kg-aprox',
      'tomates-perita-1kg-aprox',
      'cambur-seleccionado-tipo-aa-1kg-aprox',
    ],
  },
  {
    title: 'Nueva selección ❤️',
    slug: 'nueva-seleccion',
    subtitle: 'Recién llegados a la tienda',
    imageFile: 'torta-tiramisu-melegatti-400g.webp',
    placements: ['home', 'shop'],
    sortOrder: 1,
    productSlugs: [
      'jugo-de-naranja-justy-15l',
      'yogurt-griego-plain-yolo-680g',
      'torta-tiramisu-melegatti-400g',
      'toston-de-ajo-con-salsa-de-tomate-pache-90g-a-100g',
    ],
  },
  {
    title: 'Ofertas del mes 🔥',
    slug: 'ofertas-del-mes',
    subtitle: 'Precios que te encantan',
    imageFile: 'alitas-de-pollo-que-pollo-590g-aprox.webp',
    placements: ['home', 'shop'],
    sortOrder: 2,
    productSlugs: [
      'harina-maiz-blanco-libre-de-gluten-pan-1-kg',
      'aceite-de-soya-vatel-800ml',
      'malta-en-lata-morena-250ml',
      'ponche-crema-eliodoro-gonzalez-p-070l',
      'alitas-de-pollo-que-pollo-590g-aprox',
      'jamon-de-pierna-superior-alinieve-200g',
    ],
  },
  {
    title: 'Best Sellers',
    slug: 'best-sellers',
    subtitle: 'Lo que la gente compra',
    imageFile: 'arroz-blanco-tipo-1-premium-amanecer-900g.webp',
    placements: ['home', 'shop'],
    sortOrder: 3,
    productSlugs: [
      'arroz-blanco-tipo-1-premium-amanecer-900g',
      'leche-completa-esterilizada-uht-san-simon-1l',
      'huevos-carton-30-und',
      'harina-maiz-blanco-libre-de-gluten-pan-1-kg',
      'aceite-de-soya-vatel-800ml',
      'alitas-de-pollo-que-pollo-590g-aprox',
      'torta-tiramisu-melegatti-400g',
      'azucar-refinada-montalban-1-kg',
    ],
  },
];
