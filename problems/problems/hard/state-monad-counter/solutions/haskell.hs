module Solution (runCounter) where

import Control.Monad.State

processCmd :: String -> State Int ()
processCmd "inc"   = modify (+1)
processCmd "dec"   = modify (subtract 1)
processCmd "reset" = put 0
processCmd _       = return ()

runCounter :: [String] -> Int
runCounter cmds = execState (mapM_ processCmd cmds) 0
