GARMENTS_BY_GENDER = {
    "men": [
        "Kurta", "Shirt", "T-Shirt", "Jeans", "Trousers", "Blazer",
        "Sherwani", "Hoodie", "Sweater", "Shorts", "Suit"
    ],
    "women": [
        "Kurti", "Top", "Blouse", "Saree", "Lehenga", "Dress",
        "Skirt", "Salwar Suit", "Jeans", "Trousers", "Tunic"
    ],
    "unisex": [
        "T-Shirt", "Jeans", "Hoodie", "Sweater", "Tracksuit", "Jacket"
    ]
}


GARMENT_MAP = {
    "men": {
        "Kurti": "Kurta",   # women → men correction
        "Blouse": "Shirt",  # blouse → shirt for men
        "Dress": "Sherwani" # example correction if it appears
    },
    "women": {
        "Kurta": "Kurti",   # men → women correction
        "Shirt": "Blouse",  # optional: shirt replaced with blouse
    }
}


def get_garments_for_gender(gender: str) -> list[str]:
    gender = gender.lower()
    garments = GARMENTS_BY_GENDER.get(gender, [])
    mapped = []

    replacements = GARMENT_MAP.get(gender, {})
    
    for g in garments:
        if g in replacements:
            mapped.append(replacements[g])
        else:
            mapped.append(g)
    
    # + unisex garments always included
    mapped.extend(GARMENTS_BY_GENDER["unisex"])
    return sorted(set(mapped))