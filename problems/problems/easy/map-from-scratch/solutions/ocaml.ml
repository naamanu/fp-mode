let rec my_map f = function
  | [] -> []
  | x :: xs -> f x :: my_map f xs
