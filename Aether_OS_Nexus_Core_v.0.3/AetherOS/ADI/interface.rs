use alloc::vec::Vec;

use crate::ADI::analyzer::Analyzer;
use crate::ADI::sandbox::governor::Governor;
use crate::ADI::sandbox::runtime::Runtime;
use crate::ADI::translator::Translator;
use crate::device::{DeviceInfo, VNode};

pub struct ADIInterface;

impl ADIInterface {
    pub fn load_driver(device: DeviceInfo) -> Result<VNode, ADIError> {
        let analyzed = Analyzer::analyze(device.driver_source());
        let model = Translator::translate(analyzed);

        let runtime = Runtime::new(64 * 1024 * 1024, 10_000_000, Governor::new(Vec::new()));

        Ok(VNode::from_driver_model(model, runtime))
    }

    pub fn start_driver(_vnode_id: u64) -> Result<(), ADIError> {
        Ok(())
    }

    pub fn stop_driver(_vnode_id: u64) -> Result<(), ADIError> {
        Ok(())
    }
}

pub struct ADIError;
