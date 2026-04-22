use alloc::string::String;
use alloc::vec::Vec;

use crate::ADI::sandbox::model::DriverModel;

use super::analyzer::AnalyzedDriver;

pub struct Translator;

impl Translator {
    pub fn translate(_drv: AnalyzedDriver) -> DriverModel {
        DriverModel::new(0, String::from("adi-placeholder"), String::from("0.0.0"), Vec::new(), Vec::new())
    }
}
