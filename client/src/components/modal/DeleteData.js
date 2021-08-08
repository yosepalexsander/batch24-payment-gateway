import { Modal, Button } from 'react-bootstrap'

export default function DeleteData({ show, handleClose, handleDelete }) {
    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Body className="text-dark">
                <div style={{fontSize: '20px', fontWeight: '900'}}>
                    Delete Data
                </div>
                <div style={{fontSize: '16px', fontWeight: '500'}} className="mt-2">
                    Are you sure you want to delete this data?
                </div>
                <div className="text-end mt-5">
                    <Button onClick={handleDelete} size="sm" className="btn-danger me-2" style={{width: '135px'}}>Yes</Button>
                    <Button onClick={handleClose} size="sm" variant="outline-secondary" style={{width: '135px'}}>Cancel</Button>
                </div>
            </Modal.Body>
        </Modal>
    )
}
