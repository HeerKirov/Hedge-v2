package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError

data class MetaUtilValidateRes(val topics: List<TopicSimpleRes>,
                               val authors: List<AuthorSimpleRes>,
                               val tags: List<TagSimpleRes>,
                               val notSuitable: List<TagSimpleRes>,
                               val conflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>,
                               val forceConflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>)

data class MetaUtilValidateForm(val topics: List<Int>?, val authors: List<Int>?, val tags: List<Int>?)