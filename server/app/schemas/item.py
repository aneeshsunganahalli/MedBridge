from pydantic import BaseModel

class Item(BaseModel):
    name: str
    description: str | None = None

    model_config = {
        "json_schema_extra": {
            "example": {"name": "Foo", "description": "A very nice Item"}
        }
    }