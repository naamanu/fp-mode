module Solution (NestedList(..), flatten) where

data NestedList a = Elem a | List [NestedList a]
  deriving (Show)

flatten :: NestedList a -> [a]
flatten (Elem x) = [x]
flatten (List xs) = concatMap flatten xs
