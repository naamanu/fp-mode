module Solution (Tree(..), depth) where

data Tree a = Leaf | Node a (Tree a) (Tree a)
  deriving (Show)

depth :: Tree a -> Int
depth Leaf = 0
depth (Node _ l r) = 1 + max (depth l) (depth r)
