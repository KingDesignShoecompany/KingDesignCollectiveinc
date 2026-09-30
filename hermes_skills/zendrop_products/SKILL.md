# Zendrop Products

> Manage Zendrop products and travel bundles for KingDesignCollectiveINC.

## Actions

### list_products
List all Zendrop products available via proxy.

**Parameters:** none

**Returns:** Array of product objects.

### get_product
Get details for a single product by ID.

**Parameters:** 
- `id` (number, required): Zendrop product ID

**Returns:** Product object.

### search_products
Search products by keyword.

**Parameters:**
- `query` (string, required): Search term

**Returns:** Filtered product array.

### create_travel_bundle
Create a curated travel bundle for a region.

**Parameters:**
- `region` (string, required): Region name
- `max_items` (number, optional, default: 6): Maximum items

**Returns:** Bundle object.

### update_homepage_hero
Select a hero product and write homepage config JSON.

**Parameters:**
- `region` (string, optional, default: ""): Region focus

**Returns:** Homepage config object.
