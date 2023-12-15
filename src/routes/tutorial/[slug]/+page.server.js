import { get_exercise } from '$lib/server/content.js';
import { error, redirect } from '@sveltejs/kit';

export function entries() {
	return [{ slug: 'local-transitions' }];
}


export async function load({ params }) {
	if (params.slug === 'local-transitions') {
		throw redirect(307, '/tutorial/sign-order');
	}

	const exercise = await get_exercise(params.slug);

	if (!exercise) {
		throw error(404, 'No such tutorial found');
	}

	return {
		exercise
	};
}
