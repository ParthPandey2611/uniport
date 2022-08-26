import { project_type_10_FormBlock, project_type_10_InputPayload } from "@uniport/common";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useState } from "react";
import { ADD_STUDENT_PROFILE_BLOCK } from "../../../config/routes-config";
import { useStudentProfileStore } from "../../../global-stores/useStudentProfiles";
import { ProjectType10ActionDialog } from "./ActionDialog";
import { ProjectType10Block } from "./BlockInstance";


const currDate = dayjs().format('YYYY-MM-DD')
// default values (to be used while adding a new block from scratch)
const noValue: project_type_10_FormBlock = {
	block_proof_data: '',
	description: '',
	project_name: '',
	project_url: '',
	end_date: currDate,
	start_date: currDate
}

// define the fields which shall be populated while editing.
// Ideally we shall list all values except file fields like [resume_file_data] (as we don't have the location of the file).
const fieldToPopulate = [
	'description',
	'project_name',
	'project_url',
	'end_date',
	'start_date',
];


export const ProjectType10Pilot = ({ meta }) => {
	let {
		attribute_id,
		attribute_type,
		is_array,
		label,
		is_blocked,
		required,
		requires_proof,
	} = meta;

	let router = useRouter();


	const studentResumeBlocks = useStudentProfileStore(state => state.studentProfile[attribute_id]) ?? {};
	const addOrEditStudentProfileBlockInstance = useStudentProfileStore(state => state.addOrEditStudentProfileBlockInstance);

	const data = Object.entries(studentResumeBlocks);

	let student_id = router.query.student_id as string;

	// data will be an array for sure;

	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("")
	const [successMessage, setSuccessMessage] = useState("");
	// will be used by [handleSubmit] to share the blockIndex to backend; will be set by [openDialogToEditOrAddBlock]
	const [currentBlockIndexOnDialog, setCurrentBlockIndexOnDialog] = useState(null)
	const [initialValues, setinitialValues] = useState(noValue)


	// function to be called while submitting the form
	const handleSubmit = async (e: project_type_10_FormBlock) => {
		try {
			setLoading(true);
			setSuccessMessage('');
			setError(null);

			let payload: project_type_10_InputPayload = {
				...e,
				student_id,
				attribute_id,
				attribute_type,
				block_index: currentBlockIndexOnDialog ?? ''
			}


			let res = await ADD_STUDENT_PROFILE_BLOCK(payload);
			if (res['error']) {
				throw Error(res['message'])
			}

			addOrEditStudentProfileBlockInstance({
				attribute_id,
				block_index: res['block_index'],
				data: res['data']
			})

			// success
			if (res['performed_operation'] === 'EDIT_BLOCK') {
				setSuccessMessage('Blocks updated successfully');
			} else {
				setSuccessMessage('Blocks added successfully');
			}
			setLoading(false);

		} catch (err) {
			setLoading(false);
			setError(err.message);
		}

	}


	// function for children to call when they want to get themself edited
	// it shall set the values and call the legoActionDialog
	// we shall recieve null if we are adding a new block and recieve a string if we are editing
	const openDialogToEditOrAddBlock = (block_index: string) => {
		setCurrentBlockIndexOnDialog(block_index);
		setSuccessMessage('');
		setLoading(false);
		setError(null);
		setOpen(true);

		if (block_index) {
			// setting the data
			const currentInstance = studentResumeBlocks[block_index];
			// set initial values
			let newInitialValue = noValue;
			fieldToPopulate.forEach(e => {
				newInitialValue[e] = currentInstance[e]
			})
			setinitialValues(newInitialValue)
		} else {
			setinitialValues(noValue);
		}
	}



	return (
		<div>
			<div className="bg-white px-4 py-4 flex my-2 rounded-lg shadow flex-col gap-2">
				<div >
					<h2 className="text-base font-bold text-gray-700 my-0">{label}</h2>
				</div>

				{data.length === 0 && required && (
					<div className='my-1 text-xs text-left text-blue-600 bg-blue-500 bg-opacity-10 border border-blue-400 flex items-center p-2 rounded-md'>
						This field is mandatory. Please considering adding atleast 1 block by clicking the button below.
					</div>
				)}

				{data.map((e, indx) => (
					<ProjectType10Block
						key={indx}
						openDialogToEditOrAddBlock={openDialogToEditOrAddBlock}
						is_blocked={is_blocked}
						block_index={e[0]}
						data={e[1]}
					/>
				))}


				{/* if it's an array field then keep this btn or there are 0 elements */}
				<div className='flex justify-between items-center'>
					{(data.length === 0 || is_array) &&
						<div onClick={() => openDialogToEditOrAddBlock(null)} className='btn bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'>
							Add new?
						</div>}
					<div className='flex gap-2'>
						{requires_proof ? <div className='tag-style bg-yellow-200 text-red-700  px-2 py-1'>Requires Proof</div> : null}
						{required ? <div className='tag-style bg-yellow-200 text-red-700  px-2 py-1'>Required</div> : null}
					</div>
				</div>

				{open && <ProjectType10ActionDialog
					label={label}
					waitingForServerResponse={loading}
					successMessage={successMessage}
					errorMessage={error}
					handleSubmit={handleSubmit}
					open={open}
					setOpen={setOpen}
					initialValues={initialValues}
				/>
				}
			</div>
		</div>
	);
}