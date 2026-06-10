from fastapi import APIRouter
from app.schemas import Item

router = APIRouter()

@router.post("/items/", response_model=Item)
async def create_item(item: Item):
    return item

@router.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    return Item(name="Sample Item", description="This is a sample item")