import {GlobalState} from "../models/state";

export async function saveJSON(state: GlobalState) {
    console.log("exporting", state.getCurrentDocument())
    let json_obj = await state.om.toJSON(state.getCurrentDocument())
    console.log("json obj is",json_obj)
    console.log(JSON.stringify(json_obj,null,'   '))
}
