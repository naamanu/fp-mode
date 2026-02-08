module Solution (Tree(..), depth) where

data Tree a = Leaf | Node a (Tree a) (Tree a)
  deriving (Show)

-- | Compute the maximum depth of a binary tree.
-- A Leaf has depth 0.
depth :: Tree a -> Int
depth = undefined
