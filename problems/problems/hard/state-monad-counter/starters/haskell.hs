module Solution (runCounter) where

import Control.Monad.State

-- | Process a list of counter commands using the State monad.
-- Commands: "inc" (increment), "dec" (decrement), "reset" (set to 0)
-- Start from 0, return the final counter value.
runCounter :: [String] -> Int
runCounter = undefined
