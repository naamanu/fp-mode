module Solution (NestedList(..), flatten) where

data NestedList a = Elem a | List [NestedList a]
  deriving (Show)

-- | Flatten an arbitrarily nested list into a flat list.
flatten :: NestedList a -> [a]
flatten = undefined
