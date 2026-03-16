-- Schema for otel-demo: OpenTelemetry Astronomy Shop replica
-- Cloudflare D1 (SQLite) — designed to reproduce "silent auth fail" pattern

-- Products table (seeded with OTel Astronomy Shop catalog)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    picture TEXT NOT NULL,
    price_currency_code TEXT NOT NULL DEFAULT 'USD',
    price_units INTEGER NOT NULL,
    price_nanos INTEGER NOT NULL DEFAULT 0,
    categories TEXT NOT NULL DEFAULT ''
);

-- Cart items (keyed by client-generated UUID — the silent-fail pattern)
CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    user_currency TEXT NOT NULL DEFAULT 'USD',
    email TEXT,
    shipping_tracking_id TEXT,
    shipping_cost_units INTEGER NOT NULL DEFAULT 0,
    shipping_cost_nanos INTEGER NOT NULL DEFAULT 0,
    shipping_cost_currency TEXT NOT NULL DEFAULT 'USD',
    street_address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    zip_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    cost_currency_code TEXT NOT NULL DEFAULT 'USD',
    cost_units INTEGER NOT NULL DEFAULT 0,
    cost_nanos INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Seed product data (exact OTel Astronomy Shop catalog)
INSERT INTO products (id, name, description, picture, price_currency_code, price_units, price_nanos, categories) VALUES
    ('OLJCESPC7Z', 'National Park Foundation Explorascope', 'The National Park Foundation''s (NPF) Explorascope 60AZ is a manual alt-azimuth, refractor telescope perfect for celestial viewing on the go. The NPF Explorascope 60 can view the planets, moon, star clusters and brighter deep sky objects like the Orion Nebula and Andromeda Galaxy.', 'NationalParkFoundationExplorascope.jpg', 'USD', 101, 960000000, 'telescopes'),
    ('66VCHSJNUP', 'Starsense Explorer Refractor Telescope', 'The first telescope that uses your smartphone to analyze the night sky and calculate its position in real time. StarSense Explorer is ideal for beginners thanks to the app''s user-friendly interface and detailed tutorials. It''s like having your own personal tour guide of the night sky', 'StarsenseExplorer.jpg', 'USD', 349, 950000000, 'telescopes'),
    ('1YMWWN1N4O', 'Eclipsmart Travel Refractor Telescope', 'Dedicated white-light solar scope for the observer on the go. The 50mm refracting solar scope uses Solar Safe, ISO compliant, full-aperture glass filter material to ensure the safest view of solar events. The kit comes complete with everything you need, including the dedicated travel solar scope, a Solar Safe finderscope, tripod, a high quality 20mm (18x) Kellner eyepiece and a nylon backpack to carry everything in.', 'EclipsmartTravelRefractorTelescope.jpg', 'USD', 129, 950000000, 'telescopes,travel'),
    ('L9ECAV7KIM', 'Lens Cleaning Kit', 'Wipe away dust, dirt, fingerprints and other particles on your lenses to see clearly with the Lens Cleaning Kit. This cleaning kit works on all glass and optical surfaces, including telescopes, binoculars, spotting scopes, monoculars, microscopes, and even your camera lenses, computer screens, and mobile devices.', 'LensCleaningKit.jpg', 'USD', 21, 950000000, 'accessories'),
    ('2ZYFJ3GM2N', 'Roof Binoculars', 'This versatile, all-around binocular is a great choice for the trail, the stadium, the arena, or just about anywhere you want a close-up view of the action without sacrificing brightness or detail. It''s an especially great companion for nature observation and bird watching, with ED glass that helps you spot the subtlest field markings and a close focus of just 6.5 feet.', 'RoofBinoculars.jpg', 'USD', 209, 950000000, 'binoculars'),
    ('0PUK6V6EV0', 'Solar System Color Imager', 'You have your new telescope and have observed Saturn and Jupiter. Now you''re ready to take the next step and start imaging them. But where do you begin? The NexImage 10 Solar System Imager is the perfect solution.', 'SolarSystemColorImager.jpg', 'USD', 175, 0, 'accessories,telescopes'),
    ('LS4PSXUNUM', 'Red Flashlight', 'This 3-in-1 device features a 3-mode red flashlight, a hand warmer, and a portable power bank for recharging your personal electronics on the go. Whether you use it to light the way at an astronomy star party, a night walk, or wildlife research, ThermoTorch 3 Astro Red''s rugged, IPX4-rated design will withstand your everyday activities.', 'RedFlashlight.jpg', 'USD', 57, 80000000, 'accessories,flashlights'),
    ('9SIQT8TOJO', 'Optical Tube Assembly', 'Capturing impressive deep-sky astroimages is easier than ever with Rowe-Ackermann Schmidt Astrograph (RASA) V2, the perfect companion to today''s top DSLR or astronomical CCD cameras. This fast, wide-field f/2.2 system allows for shorter exposure times compared to traditional f/10 astroimaging, without sacrificing resolution.', 'OpticalTubeAssembly.jpg', 'USD', 3599, 0, 'accessories,telescopes,assembly'),
    ('6E92ZMYYFZ', 'Solar Filter', 'Enhance your viewing experience with EclipSmart Solar Filter for 8" telescopes. With two Velcro straps and four self-adhesive Velcro pads for added safety, you can be assured that the solar filter cannot be accidentally knocked off and will provide Solar Safe, ISO compliant viewing.', 'SolarFilter.jpg', 'USD', 69, 950000000, 'accessories,telescopes'),
    ('HQTGWGPNH4', 'The Comet Book', 'A 16th-century treatise on comets, created anonymously in Flanders (now northern France) and now held at the Universitaetsbibliothek Kassel. Commonly known as The Comet Book (or Kometenbuch in German).', 'TheCometBook.jpg', 'USD', 0, 990000000, 'books');
