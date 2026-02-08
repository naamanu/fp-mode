type 'a nested_list = Elem of 'a | List of 'a nested_list list

let rec flatten = function
  | Elem x -> [x]
  | List xs -> List.concat_map flatten xs
